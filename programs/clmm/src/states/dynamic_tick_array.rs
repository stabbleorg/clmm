use anchor_lang::account;
use anchor_lang::{prelude::*, system_program};
use arrayref::array_ref;
use crate::error::ErrorCode;
use crate::libraries::liquidity_math;
use crate::states::{PoolState, RewardInfo, Tick, TickArrayType, TickState, TickUpdate, REWARD_NUM, TICK_ARRAY_SIZE, TICK_ARRAY_SIZE_USIZE, TICK_ARRAY_SEED};
use crate::states::tick_array::check_is_valid_start_index;
use crate::util::create_or_allocate_account;
use crate::Result;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Debug, PartialEq, Copy)]
pub struct DynamicTickData {
    pub liquidity_net: i128,   // 16
    pub liquidity_gross: u128, // 16

    // Q64.64
    pub fee_growth_outside_0_x64: u128, // 16
    // Q64.64
    pub fee_growth_outside_1_x64: u128, // 16

    // Array of Q64.64
    pub reward_growths_outside: [u128; REWARD_NUM], // 48 = 16 * 3
}

impl DynamicTickData {
    pub const LEN: usize = 112;
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Debug, PartialEq, Copy)]
pub enum DynamicTick {
    #[default]
    Uninitialized,
    Initialized(DynamicTickData),
}

impl DynamicTick {
    /// Updates a tick and returns true if the tick was flipped from initialized to uninitialized
    pub fn update(
        &mut self,
        tick_index: i32,
        tick_current: i32,
        liquidity_delta: i128,
        fee_growth_global_0_x64: u128,
        fee_growth_global_1_x64: u128,
        upper: bool,
        reward_infos: &[RewardInfo; REWARD_NUM],
    ) -> Result<bool> {
        // Get current liquidity_gross (0 if uninitialized)
        let liquidity_gross_before = match self {
            DynamicTick::Uninitialized => 0,
            DynamicTick::Initialized(data) => data.liquidity_gross,
        };

        let liquidity_gross_after =
            liquidity_math::add_delta(liquidity_gross_before, liquidity_delta)?;

        // Either liquidity_gross_after becomes 0 (uninitialized) XOR liquidity_gross_before
        // was zero (initialized)
        let flipped = (liquidity_gross_after == 0) != (liquidity_gross_before == 0);

        // Handle initialization (flipping from Uninitialized to Initialized)
        if liquidity_gross_before == 0 && liquidity_gross_after > 0 {
            // Initialize with default values
            let mut tick_data = DynamicTickData {
                liquidity_net: 0,
                liquidity_gross: liquidity_gross_after,
                fee_growth_outside_0_x64: 0,
                fee_growth_outside_1_x64: 0,
                reward_growths_outside: [0; REWARD_NUM],
            };

            // by convention, we assume that all growth before a tick was initialized happened _below_ the tick
            if tick_index <= tick_current {
                tick_data.fee_growth_outside_0_x64 = fee_growth_global_0_x64;
                tick_data.fee_growth_outside_1_x64 = fee_growth_global_1_x64;
                tick_data.reward_growths_outside = RewardInfo::get_reward_growths(reward_infos);
            }

            // when the lower (upper) tick is crossed left to right (right to left),
            // liquidity must be added (removed)
            tick_data.liquidity_net = if upper {
                0i128.checked_sub(liquidity_delta)
            } else {
                0i128.checked_add(liquidity_delta)
            }
                .unwrap();

            *self = DynamicTick::Initialized(tick_data);
            return Ok(flipped);
        }

        // Handle uninitialization (flipping from Initialized to Uninitialized)
        if liquidity_gross_before > 0 && liquidity_gross_after == 0 {
            *self = DynamicTick::Uninitialized;
            return Ok(flipped);
        }

        // Update existing initialized tick
        if let DynamicTick::Initialized(ref mut data) = self {
            // by convention, we assume that all growth before a tick was initialized happened _below_ the tick
            // This logic only applies when initializing (handled above), so we don't need to check again here

            data.liquidity_gross = liquidity_gross_after;

            // when the lower (upper) tick is crossed left to right (right to left),
            // liquidity must be added (removed)
            data.liquidity_net = if upper {
                data.liquidity_net.checked_sub(liquidity_delta)
            } else {
                data.liquidity_net.checked_add(liquidity_delta)
            }
                .unwrap();
        }

        Ok(flipped)
    }
}

// This struct is never actually used anywhere at runtime.
// account attr is used to generate the definition in the IDL.
// 
// NOTE: Using fixed-size array for IDL generation (Anchor requires fixed-size types).
// The actual runtime account data is variable-length based on initialized ticks.
// Runtime code uses DynamicTickArrayLoader which handles variable sizing.
#[account]
pub struct DynamicTickArray {
    pub start_tick_index: i32, // 4 bytes
    pub pool_id: Pubkey,     // 32 bytes
    // 0: uninitialized, 1: initialized
    pub tick_bitmap: u128, // 16 bytes
    // Fixed-size array for IDL generation - Anchor requires fixed-size types in IDL
    // The actual runtime account data is variable-length based on initialized ticks
    // Runtime uses DynamicTickArrayLoader instead of deserializing this struct
    pub ticks: [DynamicTick; TICK_ARRAY_SIZE_USIZE],
}

impl DynamicTick {
    pub const UNINITIALIZED_LEN: usize = 1;
    pub const INITIALIZED_LEN: usize = DynamicTickData::LEN + 1;
}

impl DynamicTickArray {
    pub const MIN_LEN: usize = DynamicTickArray::DISCRIMINATOR.len()
        + 4
        + 32
        + 16
        + DynamicTick::UNINITIALIZED_LEN * TICK_ARRAY_SIZE_USIZE;
    pub const MAX_LEN: usize = DynamicTickArray::DISCRIMINATOR.len()
        + 4
        + 32
        + 16
        + DynamicTick::INITIALIZED_LEN * TICK_ARRAY_SIZE_USIZE;
}

// Anchor automatically implements Discriminator and AccountDeserialize for structs with #[account]
// so DynamicTickArray::DISCRIMINATOR is available for use in MIN_LEN and MAX_LEN
// Note: AccountDeserialize will cause stack overflow if actually called, but it's never used
// since we use DynamicTickArrayLoader instead

impl From<&TickUpdate> for DynamicTick {
    fn from(update: &TickUpdate) -> Self {
        if update.initialized {
            DynamicTick::Initialized(DynamicTickData {
                liquidity_net: update.liquidity_net,
                liquidity_gross: update.liquidity_gross,
                fee_growth_outside_0_x64: update.fee_growth_outside_0_x64,
                fee_growth_outside_1_x64: update.fee_growth_outside_1_x64,
                reward_growths_outside: update.reward_growths_outside,
            })
        } else {
            DynamicTick::Uninitialized
        }
    }
}

impl From<DynamicTick> for Tick {
    fn from(val: DynamicTick) -> Self {
        match val {
            DynamicTick::Uninitialized => Tick::default(),
            DynamicTick::Initialized(tick_data) => Tick {
                initialized: true,
                liquidity_net: tick_data.liquidity_net,
                liquidity_gross: tick_data.liquidity_gross,
                fee_growth_outside_0_x64: tick_data.fee_growth_outside_0_x64,
                fee_growth_outside_1_x64: tick_data.fee_growth_outside_1_x64,
                reward_growths_outside: tick_data.reward_growths_outside,
            },
        }
    }
}

#[derive(Debug)]
pub struct DynamicTickArrayLoader([u8; DynamicTickArray::MAX_LEN]);

#[cfg(test)]
impl Default for DynamicTickArrayLoader {
    fn default() -> Self {
        Self([0; DynamicTickArray::MAX_LEN])
    }
}

impl DynamicTickArrayLoader {
    // Reimplement these functions from bytemuck::from_bytes_mut without
    // the size and alignment checks. If reading beyond the end of the underlying
    // data, the behavior is undefined.

    pub fn load(data: &[u8]) -> &DynamicTickArrayLoader {
        unsafe { &*(data.as_ptr() as *const DynamicTickArrayLoader) }
    }

    pub fn load_mut(data: &mut [u8]) -> &mut DynamicTickArrayLoader {
        unsafe { &mut *(data.as_mut_ptr() as *mut DynamicTickArrayLoader) }
    }

    // Data layout:
    // 4 bytes for start_tick_index i32
    // 32 bytes for pool pubkey
    // 88 to 9944 bytes for tick data

    const START_TICK_INDEX_OFFSET: usize = 0;
    const POOL_OFFSET: usize = Self::START_TICK_INDEX_OFFSET + 4;
    const TICK_BITMAP_OFFSET: usize = Self::POOL_OFFSET + 32;
    const TICK_DATA_OFFSET: usize = Self::TICK_BITMAP_OFFSET + 16;

    /// Load a DynamicTickArrayLoader from tick array account info, if tick array account does not exist, then create it.
    pub fn get_or_create_tick_array<'info>(
        payer: AccountInfo<'info>,
        tick_array_account_info: AccountInfo<'info>,
        system_program: AccountInfo<'info>,
        pool_state_loader: &AccountLoader<'info, PoolState>,
        tick_array_start_index: i32,
        tick_spacing: u16,
    ) -> Result<AccountInfo<'info>> {
        require!(
            check_is_valid_start_index(tick_array_start_index, tick_spacing),
            ErrorCode::InvalidTickIndex
        );

        if tick_array_account_info.owner == &system_program::ID {
            let (expect_pda_address, bump) = Pubkey::find_program_address(
                &[
                    TICK_ARRAY_SEED.as_bytes(),
                    pool_state_loader.key().as_ref(),
                    &tick_array_start_index.to_be_bytes(),
                ],
                &crate::id(),
            );
            require_keys_eq!(expect_pda_address, tick_array_account_info.key());
            
            // Create or allocate account with MIN_LEN (starts with no initialized ticks)
            create_or_allocate_account(
                &crate::id(),
                payer,
                system_program,
                tick_array_account_info.clone(),
                &[
                    TICK_ARRAY_SEED.as_bytes(),
                    pool_state_loader.key().as_ref(),
                    &tick_array_start_index.to_be_bytes(),
                    &[bump],
                ],
                DynamicTickArray::MIN_LEN,
            )?;

            // Initialize the account data
            let mut account_data = tick_array_account_info.try_borrow_mut_data()?;
            
            // Write discriminator
            account_data[..8].copy_from_slice(&DynamicTickArray::DISCRIMINATOR);
            
            // Write start_tick_index (little-endian)
            account_data[8 + Self::START_TICK_INDEX_OFFSET..8 + Self::START_TICK_INDEX_OFFSET + 4]
                .copy_from_slice(&tick_array_start_index.to_le_bytes());
            
            // Write pool_id
            account_data[8 + Self::POOL_OFFSET..8 + Self::POOL_OFFSET + 32]
                .copy_from_slice(&pool_state_loader.key().to_bytes());
            
            // Initialize tick_bitmap to 0 (no ticks initialized)
            account_data[8 + Self::TICK_BITMAP_OFFSET..8 + Self::TICK_BITMAP_OFFSET + 16]
                .copy_from_slice(&0u128.to_le_bytes());
            
            // Tick data is already zero-initialized (all uninitialized ticks)
        } else {
            // Verify the account is owned by our program
            require_keys_eq!(
                tick_array_account_info.owner.clone(),
                crate::id().clone(),
                ErrorCode::AccountOwnedByWrongProgram
            );
            
            // Verify discriminator matches
            let account_data = tick_array_account_info.try_borrow_data()?;
            require!(
                account_data.len() >= 8,
                ErrorCode::AccountDiscriminatorNotFound
            );
            let discriminator = array_ref![account_data, 0, 8];
            require!(
                discriminator == &DynamicTickArray::DISCRIMINATOR,
                ErrorCode::AccountDiscriminatorMismatch
            );
        }
        
        Ok(tick_array_account_info)
    }

    /// Initialize only can be called when first created
    pub fn initialize(
        &mut self,
        start_index: i32,
        tick_spacing: u16,
        pool_key: Pubkey,
    ) -> Result<()> {
        check_is_valid_start_index(start_index, tick_spacing);
        self.0[Self::START_TICK_INDEX_OFFSET..Self::START_TICK_INDEX_OFFSET + 4]
            .copy_from_slice(&start_index.to_le_bytes());
        self.0[Self::POOL_OFFSET..Self::POOL_OFFSET + 32]
            .copy_from_slice(&pool_key.to_bytes());
        // tick_bitmap is already 0 (initialized in get_or_create_tick_array)
        Ok(())
    }

    fn tick_data(&self) -> &[u8] {
        &self.0[Self::TICK_DATA_OFFSET..]
    }

    fn tick_data_mut(&mut self) -> &mut [u8] {
        &mut self.0[Self::TICK_DATA_OFFSET..]
    }
}

impl TickArrayType for DynamicTickArrayLoader {
    fn is_variable_size(&self) -> bool {
        true
    }

    fn start_tick_index(&self) -> i32 {
        i32::from_le_bytes(*array_ref![self.0, Self::START_TICK_INDEX_OFFSET, 4])
    }

    fn pool(&self) -> Pubkey {
        Pubkey::new_from_array(*array_ref![self.0, Self::POOL_OFFSET, 32])
    }

    fn initialized_tick_count(&self) -> u8 {
        self.tick_bitmap().count_ones() as u8
    }

    fn get_next_init_tick_index(
        &self,
        tick_index: i32,
        tick_spacing: u16,
        a_to_b: bool,
    ) -> Result<Option<i32>> {
        if !self.in_search_range(tick_index, tick_spacing, !a_to_b) {
            return Err(ErrorCode::InvalidTickArraySequence.into());
        }

        let mut curr_offset = match self.tick_offset(tick_index, tick_spacing) {
            Ok(value) => value as i32,
            Err(e) => return Err(e),
        };

        // For a_to_b searches, the search moves to the left. The next possible init-tick can be the 1st tick in the current offset
        // For b_to_a searches, the search moves to the right. The next possible init-tick cannot be within the current offset
        if !a_to_b {
            curr_offset += 1;
        }

        let tick_bitmap = self.tick_bitmap();
        while (0..TICK_ARRAY_SIZE).contains(&curr_offset) {
            let initialized = Self::is_initialized_tick(&tick_bitmap, curr_offset as isize);
            if initialized {
                return Ok(Some(
                    (curr_offset * tick_spacing as i32) + self.start_tick_index(),
                ));
            }

            curr_offset = if a_to_b {
                curr_offset - 1
            } else {
                curr_offset + 1
            };
        }

        Ok(None)
    }

    fn get_tick(&self, tick_index: i32, tick_spacing: u16) -> Result<Tick> {
        if !self.check_in_array_bounds(tick_index, tick_spacing)
            || !Tick::check_is_usable_tick(tick_index, tick_spacing)
        {
            return Err(ErrorCode::TickNotFound.into());
        }
        let tick_offset = self.tick_offset(tick_index, tick_spacing)?;
        let byte_offset = self.byte_offset(tick_offset)?;
        let ticks_data = self.tick_data();
        let mut tick_data = &ticks_data[byte_offset..byte_offset + DynamicTick::INITIALIZED_LEN];
        let tick = DynamicTick::deserialize(&mut tick_data)?;
        Ok(tick.into())
    }

    fn update_tick(
        &mut self,
        tick_index: i32,
        tick_spacing: u16,
        update: &TickUpdate,
        account_info: Option<&AccountInfo>,
    ) -> Result<bool> {
        if !self.check_in_array_bounds(tick_index, tick_spacing)
            || !Tick::check_is_usable_tick(tick_index, tick_spacing)
        {
            return Err(ErrorCode::TickNotFound.into());
        }
        let tick_offset = self.tick_offset(tick_index, tick_spacing)?;
        let byte_offset = self.byte_offset(tick_offset)?;
        let data = self.tick_data();
        let mut tick_data = &data[byte_offset..byte_offset + DynamicTick::INITIALIZED_LEN];
        let tick: Tick = DynamicTick::deserialize(&mut tick_data)?.into();

        // Determine if the tick will be flipped (initialized state changes)
        let flipped = tick.initialized != update.initialized;

        // If the tick needs to be initialized, we need to realloc and right-shift everything after byte_offset by DynamicTickData::LEN
        if !tick.initialized && update.initialized {
            // Realloc to increase size by DynamicTickData::LEN (112 bytes) before writing
            if let Some(account) = account_info {
                let required_size = account.data_len() + DynamicTickData::LEN;
                account.realloc(required_size, true)?;
            }
            
            let data_mut = self.tick_data_mut();
            let shift_data = &mut data_mut[byte_offset..];
            shift_data.rotate_right(DynamicTickData::LEN);

            // sync bitmap
            self.update_tick_bitmap(tick_offset, true);
        }

        // If the tick needs to be uninitialized, we need to left-shift everything after byte_offset by DynamicTickData::LEN
        if tick.initialized && !update.initialized {
            let data_mut = self.tick_data_mut();
            let shift_data = &mut data_mut[byte_offset..];
            shift_data.rotate_left(DynamicTickData::LEN);

            // sync bitmap
            self.update_tick_bitmap(tick_offset, false);
            
            // Realloc to decrease size by DynamicTickData::LEN (112 bytes) after shifting
            if let Some(account) = account_info {
                let required_size = account.data_len().saturating_sub(DynamicTickData::LEN);
                account.realloc(required_size, true)?;
            }
        }

        // Update the tick data at byte_offset
        let tick_data_len = if update.initialized {
            DynamicTick::INITIALIZED_LEN
        } else {
            DynamicTick::UNINITIALIZED_LEN
        };

        let data_mut = self.tick_data_mut();
        let mut tick_data = &mut data_mut[byte_offset..byte_offset + tick_data_len];
        DynamicTick::from(update).serialize(&mut tick_data)?;

        Ok(flipped)
    }

    fn clear_tick(
        &mut self,
        tick_index: i32,
        tick_spacing: u16,
    ) -> Result<()> {
        // Use update_tick with a cleared TickUpdate to clear the tick
        let cleared_update = TickUpdate {
            initialized: false,
            liquidity_net: 0,
            liquidity_gross: 0,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };
        self.update_tick(tick_index, tick_spacing, &cleared_update, None)?;
        Ok(())
    }
}

impl DynamicTickArrayLoader {
    fn byte_offset(&self, tick_offset: isize) -> Result<usize> {
        if tick_offset < 0 {
            return Err(ErrorCode::TickNotFound.into());
        }

        let tick_bitmap = self.tick_bitmap();
        let mask = (1u128 << tick_offset) - 1;
        let initialized_ticks = (tick_bitmap & mask).count_ones() as usize;
        let uninitialized_ticks = tick_offset as usize - initialized_ticks;

        let offset = initialized_ticks * DynamicTick::INITIALIZED_LEN
            + uninitialized_ticks * DynamicTick::UNINITIALIZED_LEN;
        Ok(offset)
    }

    fn tick_bitmap(&self) -> u128 {
        u128::from_le_bytes(*array_ref![self.0, Self::TICK_BITMAP_OFFSET, 16])
    }

    fn update_tick_bitmap(&mut self, tick_offset: isize, initialized: bool) {
        let mut tick_bitmap = self.tick_bitmap();
        if initialized {
            tick_bitmap |= 1 << tick_offset;
        } else {
            tick_bitmap &= !(1 << tick_offset);
        }
        self.0[Self::TICK_BITMAP_OFFSET..Self::TICK_BITMAP_OFFSET + 16]
            .copy_from_slice(&tick_bitmap.to_le_bytes());
    }

    #[inline(always)]
    fn is_initialized_tick(tick_bitmap: &u128, tick_offset: isize) -> bool {
        (*tick_bitmap & (1 << tick_offset)) != 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// GIVEN an uninitialized tick WHEN serialized THEN the output is 1 byte
    #[test]
    fn test_uninitialized_tick_serialization_size() {
        let tick = DynamicTick::Uninitialized;

        let mut bytes = Vec::new();
        tick.serialize(&mut bytes).unwrap();

        assert_eq!(bytes.len(), DynamicTick::UNINITIALIZED_LEN);
    }


    /// GIVEN an initialized tick with data WHEN serialized THEN the output is 113 bytes
    #[test]
    fn test_initialized_tick_serialization_size() {
        let tick = DynamicTick::Initialized(DynamicTickData {
            liquidity_net: 100,
            liquidity_gross: 100,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [9; REWARD_NUM],
        });

        let mut bytes: Vec<u8> = Vec::new();
        tick.serialize(&mut bytes).unwrap();
        assert_eq!(bytes.len(), DynamicTick::INITIALIZED_LEN);
    }

    /// GIVEN an initialized tick WHEN serialized and deserialized THEN the data is preserved
    #[test]
    fn test_tick_serialization_round_trip() {
        let original = DynamicTick::Initialized(DynamicTickData {
            liquidity_net: 12345,
            liquidity_gross: 67890,
            fee_growth_outside_0_x64: 111,
            fee_growth_outside_1_x64: 222,
            reward_growths_outside: [333, 444, 555],
        });

        let mut bytes = Vec::new();
        original.serialize(&mut bytes).unwrap();

        let deserialized = DynamicTick::deserialize(&mut &bytes[..]).unwrap();
        
        assert_eq!(original, deserialized);
    }

    /// GIVEN an empty tick array WHEN a tick is initialized THEN the bitmap count increases
    #[test]
    fn test_bitmap_set_on_initialize() {
        let mut loader = DynamicTickArrayLoader::default();

        loader.initialize(0, 10, Pubkey::default()).unwrap();

        assert_eq!(loader.initialized_tick_count(), 0);

        let update = TickUpdate {
            initialized: true,
            liquidity_net: 100,
            liquidity_gross: 100,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };

        loader.update_tick(0, 10, &update, None).unwrap();

        assert_eq!(loader.initialized_tick_count(), 1);
    }

    /// GIVEN an initialized tick WHEN it is uninitialized THEN the bitmap count decreases
    #[test]
    fn test_bitmap_clear_on_uninitialize() {
        let mut loader = DynamicTickArrayLoader::default();
        loader.initialize(0, 10, Pubkey::default()).unwrap();

        let init_update = TickUpdate {
            initialized: true,
            liquidity_net: 100,
            liquidity_gross: 100,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };

        loader.update_tick(0, 10, &init_update, None).unwrap();
        assert_eq!(loader.initialized_tick_count(), 1);

        let uninit_update = TickUpdate {
            initialized: false,
            liquidity_net: 0,
            liquidity_gross: 0,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };

        loader.update_tick(0, 10, &uninit_update, None).unwrap();
        assert_eq!(loader.initialized_tick_count(), 0);
    }

    /// GIVEN an empty tick array WHEN multiple ticks are initialized THEN all are tracked in bitmap, the bitmap count increases
    #[test]
    fn test_bitmap_multiple_ticks() {
        let mut loader = DynamicTickArrayLoader::default();
        loader.initialize(0, 10, Pubkey::default()).unwrap();
        
        let init_update = TickUpdate {
            initialized: true,
            liquidity_net: 100,
            liquidity_gross: 100,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };
    
        // Initialize 3 ticks: 0, 10, 20
        loader.update_tick(0, 10, &init_update, None).unwrap();
        loader.update_tick(10, 10, &init_update, None).unwrap();
        loader.update_tick(20, 10, &init_update, None).unwrap();
    
        assert_eq!(loader.initialized_tick_count(), 3);
    }

    /// GIVEN an uninitialized tick (liquidity_gross=0) WHEN it is initialized (liquidity_gross>0) THEN update returns true indicating a tick state transition
    #[test]
    fn test_update_tick_returns_flip_on_initialize() {
        let mut loader = DynamicTickArrayLoader::default();
        loader.initialize(0, 10, Pubkey::default()).unwrap();

        let update = TickUpdate {
            initialized: true,
            liquidity_net: 100,
            liquidity_gross: 100,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };

        let flipped = loader.update_tick(0, 10, &update, None).unwrap();
        assert!(flipped);
    }

    /// GIVEN an already initialized tick (liquidity_gross>0) WHEN more liquidity is added THEN update returns false (no state transition, tick stays initialized)
    #[test]
    fn test_update_tick_no_flip_when_already_initialized() {
        let mut loader = DynamicTickArrayLoader::default();
        loader.initialize(0, 10, Pubkey::default()).unwrap();

        let update = TickUpdate {
            initialized: true,
            liquidity_net: 100,
            liquidity_gross: 100,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };

        let flipped = loader.update_tick(0, 10, &update, None).unwrap();
        assert!(flipped);

        let update2 = TickUpdate {
            initialized: true,
            liquidity_net: 200,  // Changed
            liquidity_gross: 200,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };

        let flipped_2nd_time = loader.update_tick(0, 10, &update2, None).unwrap();
        assert!(!flipped_2nd_time); // Should not flip if tick is already initialized
    }

    /// GIVEN a tick with data WHEN written and read via loader THEN data is preserved
    #[test]
    fn test_tick_data_round_trip() {
        let mut loader = DynamicTickArrayLoader::default();
        loader.initialize(0, 10, Pubkey::default()).unwrap();

        let update = TickUpdate {
            initialized: true,
            liquidity_net: 12345,
            liquidity_gross: 67890,
            fee_growth_outside_0_x64: 111,
            fee_growth_outside_1_x64: 222,
            reward_growths_outside: [333, 444, 555],
        };

        loader.update_tick(0, 10, &update, None).unwrap();

        let tick = loader.get_tick(0, 10).unwrap();

        let initialized = tick.initialized;
        let liquidity_net = tick.liquidity_net;
        let liquidity_gross = tick.liquidity_gross;
        let fee_growth_0 = tick.fee_growth_outside_0_x64;
        let fee_growth_1 = tick.fee_growth_outside_1_x64;
        let rewards = tick.reward_growths_outside;
        assert!(initialized);
        assert_eq!(liquidity_net, 12345);
        assert_eq!(liquidity_gross, 67890);
        assert_eq!(fee_growth_0, 111);
        assert_eq!(fee_growth_1, 222);
        assert_eq!(rewards, [333, 444, 555]);
    }

    /// GIVEN initialized ticks at various positions WHEN searching for next tick THEN correct tick indices are returned
    #[test]
    fn test_get_next_init_tick_index() {
        let mut loader = DynamicTickArrayLoader::default();
        loader.initialize(0, 10, Pubkey::default()).unwrap();

            
        let update = TickUpdate {
            initialized: true,
            liquidity_net: 100,
            liquidity_gross: 100,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };

        // Initialize ticks at 0, 20, 40
        loader.update_tick(0, 10, &update, None).unwrap();
        loader.update_tick(20, 10, &update, None).unwrap();
        loader.update_tick(40, 10, &update, None).unwrap();

        // Search right from tick 0 (a_to_b = false)
        let next = loader.get_next_init_tick_index(0, 10, false).unwrap();
        assert_eq!(next, Some(20));

        // Search left from tick 40 (a_to_b = true)
        let next = loader.get_next_init_tick_index(40, 10, true).unwrap();
        assert_eq!(next, Some(40));

        // Search right from tick 40 - nothing there
        let next = loader.get_next_init_tick_index(40, 10, false).unwrap();
        assert_eq!(next, None);

        // Search left from tick 0 - finds tick 0 itself (a_to_b includes current)
        let next = loader.get_next_init_tick_index(0, 10, true).unwrap();
        assert_eq!(next, Some(0));

        // If we search from tick 35 (between 30 and 40):
        let next = loader.get_next_init_tick_index(35, 10, true).unwrap();
        // This would return Some(20) - the next init tick to the left
        // Because offset(35) = 3 → tick 30, but 30 isn't initialized, so find 20
        assert_eq!(next, Some(20));
    }

    /// GIVEN an initialized tick WHEN cleared THEN the tick becomes uninitialized and bitmap count decreases
    #[test]
    fn test_clear_tick() {
        let mut loader = DynamicTickArrayLoader::default();
        loader.initialize(0, 10, Pubkey::default()).unwrap();

        let update = TickUpdate {
            initialized: true,
            liquidity_net: 100,
            liquidity_gross: 100,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };
        loader.update_tick(0, 10, &update, None).unwrap();
        assert_eq!(loader.initialized_tick_count(), 1);

        loader.clear_tick(0, 10).unwrap();

        assert_eq!(loader.initialized_tick_count(), 0);

        let tick = loader.get_tick(0, 10).unwrap();
        let initialized = tick.initialized;
        assert!(!initialized);
    }

    /// GIVEN ticks at specific offsets WHEN initialized THEN the correct bitmap bits are set (bit position = tick_offset = (tick_index - start_tick_index) / tick_spacing)
    #[test]
    fn test_bitmap_correct_bit_position() {
        let mut loader = DynamicTickArrayLoader::default();
        loader.initialize(0, 10, Pubkey::default()).unwrap();

        let init_update = TickUpdate {
            initialized: true,
            liquidity_net: 100,
            liquidity_gross: 100,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };

        // Initialize tick at index 20 (offset 2)
        loader.update_tick(20, 10, &init_update, None).unwrap();

        // Verify bit 2 is set (0b100 = 4)
        let bitmap = loader.tick_bitmap();
        assert_eq!(bitmap, 0b100);  // Only bit 2 should be set

        // Initialize tick at index 50 (offset 5)
        loader.update_tick(50, 10, &init_update, None).unwrap();

        // Verify bits 2 and 5 are set (0b100100 = 36)
        let bitmap = loader.tick_bitmap();
        assert_eq!(bitmap, 0b100100);
    }

    /// GIVEN initialized ticks with their bitmap bits set WHEN uninitialized THEN the correct bitmap bits are cleared (bit position = tick_offset)
    #[test]
    fn test_bitmap_correct_bit_reset_on_uninitialize() {
        let mut loader = DynamicTickArrayLoader::default();
        loader.initialize(0, 10, Pubkey::default()).unwrap();

        let init_update = TickUpdate {
            initialized: true,
            liquidity_net: 100,
            liquidity_gross: 100,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };

        // Initialize ticks at 20 (offset 2) and 50 (offset 5)
        loader.update_tick(20, 10, &init_update, None).unwrap();
        loader.update_tick(50, 10, &init_update, None).unwrap();
        assert_eq!(loader.tick_bitmap(), 0b100100);  // bits 2 and 5

        // Uninitialize tick 20 (offset 2)
        let uninit_update = TickUpdate {
            initialized: false,
            liquidity_net: 0,
            liquidity_gross: 0,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };
        loader.update_tick(20, 10, &uninit_update, None).unwrap();

        // Verify only bit 5 remains (0b100000 = 32)
        let bitmap = loader.tick_bitmap();
        assert_eq!(bitmap, 0b100000);

        // Uninitialize tick 50 (offset 5)
        loader.update_tick(50, 10, &uninit_update, None).unwrap();

        // Verify all bits cleared
        let bitmap = loader.tick_bitmap();
        assert_eq!(bitmap, 0b0);
    }

    /// GIVEN existing ticks WHEN a new tick is initialized in the middle THEN data shifts right and existing data is preserved
    #[test]
    fn test_data_integrity_after_shift_on_initialize() {
        let mut loader = DynamicTickArrayLoader::default();
        loader.initialize(0, 10, Pubkey::default()).unwrap();

        // Initialize tick 40 with unique data
        let update_40 = TickUpdate {
            initialized: true,
            liquidity_net: 4000,
            liquidity_gross: 4001,
            fee_growth_outside_0_x64: 4002,
            fee_growth_outside_1_x64: 4003,
            reward_growths_outside: [4004, 4005, 4006],
        };
        loader.update_tick(40, 10, &update_40, None).unwrap();

        // Initialize tick 60 with unique data
        let update_60 = TickUpdate {
            initialized: true,
            liquidity_net: 6000,
            liquidity_gross: 6001,
            fee_growth_outside_0_x64: 6002,
            fee_growth_outside_1_x64: 6003,
            reward_growths_outside: [6004, 6005, 6006],
        };
        loader.update_tick(60, 10, &update_60, None).unwrap();

        // Now initialize tick 50 IN THE MIDDLE - this causes tick 60's data to shift right
        let update_50 = TickUpdate {
            initialized: true,
            liquidity_net: 5000,
            liquidity_gross: 5001,
            fee_growth_outside_0_x64: 5002,
            fee_growth_outside_1_x64: 5003,
            reward_growths_outside: [5004, 5005, 5006],
        };
        loader.update_tick(50, 10, &update_50, None).unwrap();

        // Verify tick 40 data is still intact (copy to local vars for packed struct)
        let tick_40 = loader.get_tick(40, 10).unwrap();
        let t40_liq_net = tick_40.liquidity_net;
        let t40_liq_gross = tick_40.liquidity_gross;
        let t40_fee_0 = tick_40.fee_growth_outside_0_x64;
        let t40_fee_1 = tick_40.fee_growth_outside_1_x64;
        let t40_rewards = tick_40.reward_growths_outside;
        assert_eq!(t40_liq_net, 4000);
        assert_eq!(t40_liq_gross, 4001);
        assert_eq!(t40_fee_0, 4002);
        assert_eq!(t40_fee_1, 4003);
        assert_eq!(t40_rewards, [4004, 4005, 4006]);

        // Verify tick 50 data is correct
        let tick_50 = loader.get_tick(50, 10).unwrap();
        let t50_liq_net = tick_50.liquidity_net;
        let t50_liq_gross = tick_50.liquidity_gross;
        assert_eq!(t50_liq_net, 5000);
        assert_eq!(t50_liq_gross, 5001);

        // CRITICAL: Verify tick 60 data is still intact after the shift!
        let tick_60 = loader.get_tick(60, 10).unwrap();
        let t60_liq_net = tick_60.liquidity_net;
        let t60_liq_gross = tick_60.liquidity_gross;
        let t60_fee_0 = tick_60.fee_growth_outside_0_x64;
        let t60_fee_1 = tick_60.fee_growth_outside_1_x64;
        let t60_rewards = tick_60.reward_growths_outside;
        assert_eq!(t60_liq_net, 6000);
        assert_eq!(t60_liq_gross, 6001);
        assert_eq!(t60_fee_0, 6002);
        assert_eq!(t60_fee_1, 6003);
        assert_eq!(t60_rewards, [6004, 6005, 6006]);
    }

    /// GIVEN multiple initialized ticks WHEN a middle tick is uninitialized THEN data shifts left and remaining data is preserved
    #[test]
    fn test_data_integrity_after_shift_on_uninitialize() {
        let mut loader = DynamicTickArrayLoader::default();
        loader.initialize(0, 10, Pubkey::default()).unwrap();

        // Initialize ticks at 40, 50, 60 with unique data
        let update_40 = TickUpdate {
            initialized: true,
            liquidity_net: 4000,
            liquidity_gross: 4001,
            fee_growth_outside_0_x64: 4002,
            fee_growth_outside_1_x64: 4003,
            reward_growths_outside: [4004, 4005, 4006],
        };
        loader.update_tick(40, 10, &update_40, None).unwrap();

        let update_50 = TickUpdate {
            initialized: true,
            liquidity_net: 5000,
            liquidity_gross: 5001,
            fee_growth_outside_0_x64: 5002,
            fee_growth_outside_1_x64: 5003,
            reward_growths_outside: [5004, 5005, 5006],
        };
        loader.update_tick(50, 10, &update_50, None).unwrap();

        let update_60 = TickUpdate {
            initialized: true,
            liquidity_net: 6000,
            liquidity_gross: 6001,
            fee_growth_outside_0_x64: 6002,
            fee_growth_outside_1_x64: 6003,
            reward_growths_outside: [6004, 6005, 6006],
        };
        loader.update_tick(60, 10, &update_60, None).unwrap();

        assert_eq!(loader.initialized_tick_count(), 3);

        // Now UNINITIALIZE tick 50 in the middle - this causes tick 60's data to shift LEFT
        let uninit_update = TickUpdate {
            initialized: false,
            liquidity_net: 0,
            liquidity_gross: 0,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };
        loader.update_tick(50, 10, &uninit_update, None).unwrap();

        assert_eq!(loader.initialized_tick_count(), 2);

        // Verify tick 40 data is still intact (copy to local vars for packed struct)
        let tick_40 = loader.get_tick(40, 10).unwrap();
        let t40_liq_net = tick_40.liquidity_net;
        let t40_liq_gross = tick_40.liquidity_gross;
        let t40_fee_0 = tick_40.fee_growth_outside_0_x64;
        let t40_fee_1 = tick_40.fee_growth_outside_1_x64;
        let t40_rewards = tick_40.reward_growths_outside;
        assert_eq!(t40_liq_net, 4000);
        assert_eq!(t40_liq_gross, 4001);
        assert_eq!(t40_fee_0, 4002);
        assert_eq!(t40_fee_1, 4003);
        assert_eq!(t40_rewards, [4004, 4005, 4006]);

        // Verify tick 50 is now uninitialized
        let tick_50 = loader.get_tick(50, 10).unwrap();
        assert!(!tick_50.initialized);

        // CRITICAL: Verify tick 60 data is still intact after the shift LEFT!
        let tick_60 = loader.get_tick(60, 10).unwrap();
        let t60_liq_net = tick_60.liquidity_net;
        let t60_liq_gross = tick_60.liquidity_gross;
        let t60_fee_0 = tick_60.fee_growth_outside_0_x64;
        let t60_fee_1 = tick_60.fee_growth_outside_1_x64;
        let t60_rewards = tick_60.reward_growths_outside;
        assert_eq!(t60_liq_net, 6000);
        assert_eq!(t60_liq_gross, 6001);
        assert_eq!(t60_fee_0, 6002);
        assert_eq!(t60_fee_1, 6003);
        assert_eq!(t60_rewards, [6004, 6005, 6006]);
    }

    /// GIVEN a tick array with negative start_tick_index WHEN ticks are initialized THEN operations work correctly with negative indices
    #[test]
    fn test_negative_start_tick_index() {
        let mut loader = DynamicTickArrayLoader::default();
        // Initialize with negative start_tick_index (common in real pools)
        loader.initialize(-600, 10, Pubkey::default()).unwrap();

        // Verify start_tick_index
        assert_eq!(loader.start_tick_index(), -600);

        // Initialize tick at -600 (offset 0)
        let update = TickUpdate {
            initialized: true,
            liquidity_net: 100,
            liquidity_gross: 100,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };
        loader.update_tick(-600, 10, &update, None).unwrap();

        // Initialize tick at -500 (offset 10)
        loader.update_tick(-500, 10, &update, None).unwrap();

        // Initialize tick at -10 (offset 59, last tick in array)
        // -600 + (59 * 10) = -600 + 590 = -10
        loader.update_tick(-10, 10, &update, None).unwrap();

        assert_eq!(loader.initialized_tick_count(), 3);

        // Verify we can read back the ticks
        let tick_first = loader.get_tick(-600, 10).unwrap();
        assert!(tick_first.initialized);

        let tick_middle = loader.get_tick(-500, 10).unwrap();
        assert!(tick_middle.initialized);

        let tick_last = loader.get_tick(-10, 10).unwrap();
        assert!(tick_last.initialized);

        // Verify get_next_init_tick_index works with negative indices
        // From -550, searching left should find -600
        let next = loader.get_next_init_tick_index(-550, 10, true).unwrap();
        assert_eq!(next, Some(-600));

        // From -550, searching right should find -500
        let next = loader.get_next_init_tick_index(-550, 10, false).unwrap();
        assert_eq!(next, Some(-500));
    }

    /// GIVEN a tick array WHEN first (offset 0) and last (offset 59) ticks are initialized THEN boundary ticks work correctly
    #[test]
    fn test_edge_cases_first_and_last_tick() {
        let mut loader = DynamicTickArrayLoader::default();
        loader.initialize(0, 10, Pubkey::default()).unwrap();

        let update = TickUpdate {
            initialized: true,
            liquidity_net: 100,
            liquidity_gross: 100,
            fee_growth_outside_0_x64: 0,
            fee_growth_outside_1_x64: 0,
            reward_growths_outside: [0; REWARD_NUM],
        };

        // First tick in array: offset 0
        loader.update_tick(0, 10, &update, None).unwrap();
        
        // Last tick in array: offset 59 (TICK_ARRAY_SIZE - 1)
        // tick_index = start_tick_index + (offset * tick_spacing) = 0 + (59 * 10) = 590
        loader.update_tick(590, 10, &update, None).unwrap();

        assert_eq!(loader.initialized_tick_count(), 2);

        // Verify bitmap has bits 0 and 59 set
        let bitmap = loader.tick_bitmap();
        assert!(bitmap & (1 << 0) != 0, "Bit 0 should be set");
        assert!(bitmap & (1 << 59) != 0, "Bit 59 should be set");

        // Verify we can read both ticks
        let tick_first = loader.get_tick(0, 10).unwrap();
        assert!(tick_first.initialized);

        let tick_last = loader.get_tick(590, 10).unwrap();
        assert!(tick_last.initialized);

        // Verify search from middle finds first/last correctly
        let next_left = loader.get_next_init_tick_index(300, 10, true).unwrap();
        assert_eq!(next_left, Some(0), "Searching left from 300 should find 0");

        let next_right = loader.get_next_init_tick_index(300, 10, false).unwrap();
        assert_eq!(next_right, Some(590), "Searching right from 300 should find 590");
    }

    /// GIVEN tick position relative to current price WHEN tick is initialized THEN fee_growth_outside is set correctly (global if tick <= current, zero otherwise)
    #[test]
    fn test_dynamic_tick_update_fee_initialization() {
        // Test the DynamicTick::update() fee initialization logic:
        // - When tick_index <= tick_current: fee_growth_outside = fee_growth_global
        // - When tick_index > tick_current: fee_growth_outside = 0
        
        let reward_infos: [RewardInfo; REWARD_NUM] = Default::default();
        
        // Case 1: tick_index <= tick_current (tick is below current price)
        // Fee growth should be set to global values
        {
            let mut tick = DynamicTick::Uninitialized;
            let tick_index = 100;
            let tick_current = 200;  // Current price is above this tick
            let fee_growth_global_0 = 1000u128;
            let fee_growth_global_1 = 2000u128;
            
            let flipped = tick.update(
                tick_index,
                tick_current,
                1000,  // Add liquidity
                fee_growth_global_0,
                fee_growth_global_1,
                false,  // lower tick
                &reward_infos,
            ).unwrap();
            
            assert!(flipped, "Should flip from uninitialized to initialized");
            
            if let DynamicTick::Initialized(data) = tick {
                // Fee growth outside should be set to global values
                assert_eq!(data.fee_growth_outside_0_x64, fee_growth_global_0,
                    "Fee growth 0 should equal global when tick <= current");
                assert_eq!(data.fee_growth_outside_1_x64, fee_growth_global_1,
                    "Fee growth 1 should equal global when tick <= current");
                assert_eq!(data.liquidity_net, 1000, "Lower tick should add liquidity");
            } else {
                panic!("Tick should be initialized");
            }
        }
        
        // Case 2: tick_index > tick_current (tick is above current price)
        // Fee growth should be zero
        {
            let mut tick = DynamicTick::Uninitialized;
            let tick_index = 300;
            let tick_current = 200;  // Current price is below this tick
            let fee_growth_global_0 = 1000u128;
            let fee_growth_global_1 = 2000u128;
            
            let flipped = tick.update(
                tick_index,
                tick_current,
                1000,  // Add liquidity
                fee_growth_global_0,
                fee_growth_global_1,
                true,  // upper tick
                &reward_infos,
            ).unwrap();
            
            assert!(flipped, "Should flip from uninitialized to initialized");
            
            if let DynamicTick::Initialized(data) = tick {
                // Fee growth outside should be ZERO (tick is above current)
                assert_eq!(data.fee_growth_outside_0_x64, 0,
                    "Fee growth 0 should be zero when tick > current");
                assert_eq!(data.fee_growth_outside_1_x64, 0,
                    "Fee growth 1 should be zero when tick > current");
                assert_eq!(data.liquidity_net, -1000, "Upper tick should subtract liquidity");
            } else {
                panic!("Tick should be initialized");
            }
        }
        
        // Case 3: tick_index == tick_current (boundary case)
        // By convention (<= means include), fee growth should be set to global values
        {
            let mut tick = DynamicTick::Uninitialized;
            let tick_index = 200;
            let tick_current = 200;  // Current price is exactly at this tick
            let fee_growth_global_0 = 5000u128;
            let fee_growth_global_1 = 6000u128;
            
            tick.update(
                tick_index,
                tick_current,
                500,
                fee_growth_global_0,
                fee_growth_global_1,
                false,
                &reward_infos,
            ).unwrap();
            
            if let DynamicTick::Initialized(data) = tick {
                // At boundary (==), fee growth should equal global (due to <=)
                assert_eq!(data.fee_growth_outside_0_x64, fee_growth_global_0,
                    "Fee growth 0 should equal global when tick == current");
                assert_eq!(data.fee_growth_outside_1_x64, fee_growth_global_1,
                    "Fee growth 1 should equal global when tick == current");
            } else {
                panic!("Tick should be initialized");
            }
        }
    }
}