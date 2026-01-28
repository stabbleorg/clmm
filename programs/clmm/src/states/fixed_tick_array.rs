use super::pool::PoolState;
use crate::error::ErrorCode as StabbleErrorCode;
use crate::libraries::{liquidity_math, tick_math};
use crate::pool::{RewardInfo, REWARD_NUM};
use crate::util::*;
use crate::Result;
use anchor_lang::{prelude::*, system_program};
#[cfg(feature = "enable-log")]
use std::convert::identity;
use crate::states::{Tick, TickArrayType, TickUpdate, TICK_ARRAY_SEED, TICK_ARRAY_SIZE, TICK_ARRAY_SIZE_USIZE};

// The actual type should still be called TickArray so that it derives
// the correct discriminator. This same rename is done in the SDKs to make the distinction clear between
// * TickArray: A variable- or fixed-length tick array
// * FixedTickArray: A fixed-length tick array
// * DynamicTickArray: A variable-length tick array
pub type FixedTickArray = TickArrayState;

#[deprecated(note = "Use FixedTickArray instead")]
#[account(zero_copy(unsafe))]
#[repr(C, packed)]
pub struct TickArrayState {
    pub pool_id: Pubkey,
    pub start_tick_index: i32,
    pub ticks: [TickState; TICK_ARRAY_SIZE_USIZE],
    pub initialized_tick_count: u8,
    // account update recent epoch
    pub recent_epoch: u64,
    // Unused bytes for future upgrades.
    pub padding: [u8; 107],
}

impl FixedTickArray {
    pub const LEN: usize = 8 + 32 + 4 + TickState::LEN * TICK_ARRAY_SIZE_USIZE + 1 + 115;

    pub fn key(&self) -> Pubkey {
        Pubkey::find_program_address(
            &[
                TICK_ARRAY_SEED.as_bytes(),
                self.pool_id.as_ref(),
                &self.start_tick_index.to_be_bytes(),
            ],
            &crate::id(),
        )
        .0
    }
    /// Load a TickArrayState of type AccountLoader from tickarray account info, if tickarray account does not exist, then create it.
    pub fn get_or_create_tick_array<'info>(
        payer: AccountInfo<'info>,
        tick_array_account_info: AccountInfo<'info>,
        system_program: AccountInfo<'info>,
        pool_state_loader: &AccountLoader<'info, PoolState>,
        tick_array_start_index: i32,
        tick_spacing: u16,
    ) -> Result<AccountLoad<'info, TickArrayState>> {
        require!(
            TickArrayState::check_is_valid_start_index(tick_array_start_index, tick_spacing),
            StabbleErrorCode::InvalidTickIndex
        );

        let tick_array_state = if tick_array_account_info.owner == &system_program::ID {
            let (expect_pda_address, bump) = Pubkey::find_program_address(
                &[
                    TICK_ARRAY_SEED.as_bytes(),
                    pool_state_loader.key().as_ref(),
                    &tick_array_start_index.to_be_bytes(),
                ],
                &crate::id(),
            );
            require_keys_eq!(expect_pda_address, tick_array_account_info.key());
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
                TickArrayState::LEN,
            )?;
            let tick_array_state_loader = AccountLoad::<TickArrayState>::try_from_unchecked(
                &crate::id(),
                &tick_array_account_info,
            )?;
            {
                let mut tick_array_account = tick_array_state_loader.load_init()?;
                tick_array_account.initialize(
                    tick_array_start_index,
                    tick_spacing,
                    pool_state_loader.key(),
                )?;
            }
            tick_array_state_loader
        } else {
            AccountLoad::<TickArrayState>::try_from(&tick_array_account_info)?
        };
        Ok(tick_array_state)
    }

    /**
     * Initialize only can be called when first created
     */
    pub fn initialize(
        &mut self,
        start_index: i32,
        tick_spacing: u16,
        pool_key: Pubkey,
    ) -> Result<()> {
        TickArrayState::check_is_valid_start_index(start_index, tick_spacing);
        self.start_tick_index = start_index;
        self.pool_id = pool_key;
        self.recent_epoch = get_recent_epoch()?;
        Ok(())
    }

    pub fn update_initialized_tick_count(&mut self, add: bool) -> Result<()> {
        if add {
            self.initialized_tick_count += 1;
        } else {
            self.initialized_tick_count -= 1;
        }
        Ok(())
    }

    pub fn get_tick_state_mut(
        &mut self,
        tick_index: i32,
        tick_spacing: u16,
    ) -> Result<&mut TickState> {
        let offset_in_array = self.get_tick_offset_in_array(tick_index, tick_spacing)?;
        Ok(&mut self.ticks[offset_in_array])
    }

    pub fn update_tick_state(
        &mut self,
        tick_index: i32,
        tick_spacing: u16,
        tick_state: TickState,
    ) -> Result<()> {
        let offset_in_array = self.get_tick_offset_in_array(tick_index, tick_spacing)?;
        self.ticks[offset_in_array] = tick_state;
        self.recent_epoch = get_recent_epoch()?;
        Ok(())
    }

    /// Get tick's offset in current tick array, tick must be include in tick array， otherwise throw an error
    fn get_tick_offset_in_array(self, tick_index: i32, tick_spacing: u16) -> Result<usize> {
        let start_tick_index = TickArrayState::get_array_start_index(tick_index, tick_spacing);
        require_eq!(
            start_tick_index,
            self.start_tick_index,
            StabbleErrorCode::InvalidTickArray
        );
        let offset_in_array =
            ((tick_index - self.start_tick_index) / i32::from(tick_spacing)) as usize;
        Ok(offset_in_array)
    }

    /// Base on swap directioin, return the first initialized tick in the tick array.
    pub fn first_initialized_tick(&mut self, zero_for_one: bool) -> Result<&mut TickState> {
        if zero_for_one {
            let mut i = TICK_ARRAY_SIZE - 1;
            while i >= 0 {
                if self.ticks[i as usize].is_initialized() {
                    return Ok(self.ticks.get_mut(i as usize).unwrap());
                }
                i = i - 1;
            }
        } else {
            let mut i = 0;
            while i < TICK_ARRAY_SIZE_USIZE {
                if self.ticks[i].is_initialized() {
                    return Ok(self.ticks.get_mut(i).unwrap());
                }
                i = i + 1;
            }
        }
        err!(StabbleErrorCode::InvalidTickArray)
    }

    /// Get next initialized tick in tick array, `current_tick_index` can be any tick index, in other words, `current_tick_index` not exactly a point in the tickarray,
    /// and current_tick_index % tick_spacing maybe not equal zero.
    /// If price move to left tick <= current_tick_index, or to right tick > current_tick_index
    pub fn next_initialized_tick(
        &mut self,
        current_tick_index: i32,
        tick_spacing: u16,
        zero_for_one: bool,
    ) -> Result<Option<&mut TickState>> {
        let current_tick_array_start_index =
            TickArrayState::get_array_start_index(current_tick_index, tick_spacing);
        if current_tick_array_start_index != self.start_tick_index {
            return Ok(None);
        }
        let mut offset_in_array =
            (current_tick_index - self.start_tick_index) / i32::from(tick_spacing);

        if zero_for_one {
            while offset_in_array >= 0 {
                if self.ticks[offset_in_array as usize].is_initialized() {
                    return Ok(self.ticks.get_mut(offset_in_array as usize));
                }
                offset_in_array = offset_in_array - 1;
            }
        } else {
            offset_in_array = offset_in_array + 1;
            while offset_in_array < TICK_ARRAY_SIZE {
                if self.ticks[offset_in_array as usize].is_initialized() {
                    return Ok(self.ticks.get_mut(offset_in_array as usize));
                }
                offset_in_array = offset_in_array + 1;
            }
        }
        Ok(None)
    }

    /// Base on swap directioin, return the next tick array start index.
    pub fn next_tick_arrary_start_index(&self, tick_spacing: u16, zero_for_one: bool) -> i32 {
        let ticks_in_array = TICK_ARRAY_SIZE * i32::from(tick_spacing);
        if zero_for_one {
            self.start_tick_index - ticks_in_array
        } else {
            self.start_tick_index + ticks_in_array
        }
    }

    /// Input an arbitrary tick_index, output the start_index of the tick_array it sits on
    pub fn get_array_start_index(tick_index: i32, tick_spacing: u16) -> i32 {
        let ticks_in_array = TickArrayState::tick_count(tick_spacing);
        let mut start = tick_index / ticks_in_array;
        if tick_index < 0 && tick_index % ticks_in_array != 0 {
            start = start - 1
        }
        start * ticks_in_array
    }

    pub fn check_is_valid_start_index(tick_index: i32, tick_spacing: u16) -> bool {
        if TickState::check_is_out_of_boundary(tick_index) {
            if tick_index > tick_math::MAX_TICK {
                return false;
            }
            let min_start_index =
                TickArrayState::get_array_start_index(tick_math::MIN_TICK, tick_spacing);
            return tick_index == min_start_index;
        }
        tick_index % TickArrayState::tick_count(tick_spacing) == 0
    }

    pub fn tick_count(tick_spacing: u16) -> i32 {
        TICK_ARRAY_SIZE * i32::from(tick_spacing)
    }
}

impl Default for TickArrayState {
    #[inline]
    fn default() -> TickArrayState {
        TickArrayState {
            pool_id: Pubkey::default(),
            ticks: [TickState::default(); TICK_ARRAY_SIZE_USIZE],
            start_tick_index: 0,
            initialized_tick_count: 0,
            recent_epoch: 0,
            padding: [0; 107],
        }
    }
}

impl TickArrayType for TickArrayState {
    fn is_variable_size(&self) -> bool {
        false
    }

    fn start_tick_index(&self) -> i32 {
        self.start_tick_index
    }

    fn pool(&self) -> Pubkey {
        self.pool_id
    }

    fn initialized_tick_count(&self) -> u8 {
        let mut count: u8 = 0;
        for tick_state in &self.ticks {
            if tick_state.liquidity_gross > 0 { count += 1 }
        }
        count
    }

    /// Search for the next initialized tick in this array.
    ///
    /// # Parameters
    /// - `tick_index` - A i32 integer representing the tick index to start searching for
    /// - `tick_spacing` - A u8 integer of the tick spacing for this pool
    /// - `a_to_b` - If the trade is from a_to_b, the search will move to the left and the starting search tick is inclusive.
    ///              If the trade is from b_to_a, the search will move to the right and the starting search tick is not inclusive.
    ///
    /// # Returns
    /// - `Some(i32)`: The next initialized tick index of this array
    /// - `None`: An initialized tick index was not found in this array
    /// - `InvalidTickArraySequence` - error if `tick_index` is not a valid search tick for the array
    /// - `InvalidTickSpacing` - error if the provided tick spacing is 0
    fn get_next_init_tick_index(
        &self,
        tick_index: i32,
        tick_spacing: u16,
        a_to_b: bool,
    ) -> Result<Option<i32>> {
        if !self.in_search_range(tick_index, tick_spacing, !a_to_b) {
            return Err(StabbleErrorCode::InvalidTickArraySequence.into());
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

        while (0..TICK_ARRAY_SIZE).contains(&curr_offset) {
            let curr_tick = self.ticks[curr_offset as usize];
            if curr_tick.liquidity_gross > 0 {
                return Ok(Some(
                    (curr_offset * tick_spacing as i32) + self.start_tick_index,
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

    /// Get the Tick object at the given tick-index & tick-spacing
    ///
    /// # Parameters
    /// - `tick_index` - the tick index the desired Tick object is stored in
    /// - `tick_spacing` - A u8 integer of the tick spacing for this pool
    ///
    /// # Returns
    /// - `&Tick`: A reference to the desired Tick object
    /// - `TickNotFound`: - The provided tick-index is not an initializable tick index in this pool w/ this tick-spacing.
    fn get_tick(&self, tick_index: i32, tick_spacing: u16) -> Result<Tick> {
        if !self.check_in_array_bounds(tick_index, tick_spacing)
            || !Tick::check_is_usable_tick(tick_index, tick_spacing)
        {
            return Err(StabbleErrorCode::TickNotFound.into());
        }
        let offset = self.tick_offset(tick_index, tick_spacing)?;
        if offset < 0 {
            return Err(StabbleErrorCode::TickNotFound.into());
        }
        let tick_state = self.ticks[offset as usize];
        Ok(Tick {
            initialized: true,
            liquidity_net: tick_state.liquidity_net,
            liquidity_gross: tick_state.liquidity_gross,
            fee_growth_outside_0_x64: tick_state.fee_growth_outside_0_x64,
            fee_growth_outside_1_x64: tick_state.fee_growth_outside_1_x64,
            reward_growths_outside: tick_state.reward_growths_outside_x64,
        })
    }

    /// Updates the Tick object at the given tick-index & tick-spacing
    ///
    /// # Parameters
    /// - `tick_index` - the tick index the desired Tick object is stored in
    /// - `tick_spacing` - A u8 integer of the tick spacing for this whirlpool
    /// - `update` - A reference to a TickUpdate object to update the Tick object at the given index
    ///
    /// # Errors
    /// - `TickNotFound`: - The provided tick-index is not an initializable tick index in this Whirlpool w/ this tick-spacing.
    fn update_tick(
        &mut self,
        tick_index: i32,
        tick_spacing: u16,
        update: &TickUpdate,
    ) -> Result<bool> {
        if !self.check_in_array_bounds(tick_index, tick_spacing)
            || !Tick::check_is_usable_tick(tick_index, tick_spacing)
        {
            return Err(StabbleErrorCode::TickNotFound.into());
        }
        let offset = self.tick_offset(tick_index, tick_spacing)?;
        if offset < 0 {
            return Err(StabbleErrorCode::TickNotFound.into());
        }
        let tick = self.ticks.get_mut(offset as usize).unwrap();
        
        // Check if tick was initialized before (liquidity_gross != 0)
        let was_initialized = tick.liquidity_gross != 0;
        let will_be_initialized = update.initialized;
        
        // A flip occurs when the initialized state changes
        let flipped = was_initialized != will_be_initialized;
        
        tick.process_tick_update(update, tick_index);
        Ok(flipped)
    }

    /// Clears the tick at the given tick_index (CLMM pool tick index, not array index)
    ///
    /// # Parameters
    /// - `tick_index` - the tick index to clear (CLMM pool tick index)
    /// - `tick_spacing` - A u16 integer of the tick spacing for this pool
    ///
    /// # Errors
    /// - `TickNotFound`: The provided tick-index is not a valid tick index in this array
    fn clear_tick(
        &mut self,
        tick_index: i32,
        tick_spacing: u16,
    ) -> Result<()> {
        if !self.check_in_array_bounds(tick_index, tick_spacing)
            || !Tick::check_is_usable_tick(tick_index, tick_spacing)
        {
            return Err(StabbleErrorCode::TickNotFound.into());
        }
        let offset = self.tick_offset(tick_index, tick_spacing)?;
        if offset < 0 {
            return Err(StabbleErrorCode::TickNotFound.into());
        }
        let tick = self.ticks.get_mut(offset as usize).unwrap();
        tick.clear();
        Ok(())
    }
}

#[zero_copy(unsafe)]
#[repr(C, packed)]
#[derive(Default, Debug)]
pub struct TickState {
    pub tick: i32,
    /// Amount of net liquidity added (subtracted) when tick is crossed from left to right (right to left)
    pub liquidity_net: i128,
    /// The total position liquidity that references this tick
    pub liquidity_gross: u128,

    /// Fee growth per unit of liquidity on the _other_ side of this tick (relative to the current tick)
    /// only has relative meaning, not absolute — the value depends on when the tick is initialized
    pub fee_growth_outside_0_x64: u128,
    pub fee_growth_outside_1_x64: u128,

    // Reward growth per unit of liquidity like fee, array of Q64.64
    pub reward_growths_outside_x64: [u128; REWARD_NUM],
    // Unused bytes for future upgrades.
    pub padding: [u32; 13],
}

impl TickState {
    pub const LEN: usize = 4 + 16 + 16 + 16 + 16 + 16 * REWARD_NUM + 16 + 16 + 8 + 8 + 4;

    pub fn initialize(&mut self, tick: i32, tick_spacing: u16) -> Result<()> {
        if TickState::check_is_out_of_boundary(tick) {
            return err!(StabbleErrorCode::InvalidTickIndex);
        }
        require!(
            tick % i32::from(tick_spacing) == 0,
            StabbleErrorCode::TickAndSpacingNotMatch
        );
        self.tick = tick;
        Ok(())
    }
    /// Apply an update for this tick
    ///
    /// # Parameters
    /// - `update` - An update object to update the values in this tick
    pub fn process_tick_update(&mut self, update: &TickUpdate, tick_index: i32,) {
        self.liquidity_net = update.liquidity_net;
        self.liquidity_gross = update.liquidity_gross;
        self.fee_growth_outside_0_x64 = update.fee_growth_outside_0_x64;
        self.fee_growth_outside_1_x64 = update.fee_growth_outside_1_x64;
        self.reward_growths_outside_x64 = update.reward_growths_outside;
        self.tick = tick_index;
    }

    /// Updates a tick and returns true if the tick was flipped from initialized to uninitialized
    pub fn update(
        &mut self,
        tick_current: i32,
        liquidity_delta: i128,
        fee_growth_global_0_x64: u128,
        fee_growth_global_1_x64: u128,
        upper: bool,
        reward_infos: &[RewardInfo; REWARD_NUM],
    ) -> Result<bool> {
        let liquidity_gross_before = self.liquidity_gross;
        let liquidity_gross_after =
            liquidity_math::add_delta(liquidity_gross_before, liquidity_delta)?;

        // Either liquidity_gross_after becomes 0 (uninitialized) XOR liquidity_gross_before
        // was zero (initialized)
        let flipped = (liquidity_gross_after == 0) != (liquidity_gross_before == 0);
        if liquidity_gross_before == 0 {
            // by convention, we assume that all growth before a tick was initialized happened _below_ the tick
            if self.tick <= tick_current {
                self.fee_growth_outside_0_x64 = fee_growth_global_0_x64;
                self.fee_growth_outside_1_x64 = fee_growth_global_1_x64;
                self.reward_growths_outside_x64 = RewardInfo::get_reward_growths(reward_infos);
            }
        }

        self.liquidity_gross = liquidity_gross_after;

        // when the lower (upper) tick is crossed left to right (right to left),
        // liquidity must be added (removed)
        self.liquidity_net = if upper {
            self.liquidity_net.checked_sub(liquidity_delta)
        } else {
            self.liquidity_net.checked_add(liquidity_delta)
        }
        .unwrap();
        Ok(flipped)
    }

    /// Transitions to the current tick as needed by price movement, returning the amount of liquidity
    /// added (subtracted) when tick is crossed from left to right (right to left)
    pub fn cross(
        &mut self,
        fee_growth_global_0_x64: u128,
        fee_growth_global_1_x64: u128,
        reward_infos: &[RewardInfo; REWARD_NUM],
    ) -> i128 {
        self.fee_growth_outside_0_x64 = fee_growth_global_0_x64
            .checked_sub(self.fee_growth_outside_0_x64)
            .unwrap();
        self.fee_growth_outside_1_x64 = fee_growth_global_1_x64
            .checked_sub(self.fee_growth_outside_1_x64)
            .unwrap();

        for i in 0..REWARD_NUM {
            if !reward_infos[i].initialized() {
                continue;
            }

            self.reward_growths_outside_x64[i] = reward_infos[i]
                .reward_growth_global_x64
                .checked_sub(self.reward_growths_outside_x64[i])
                .unwrap();
        }

        self.liquidity_net
    }

    pub fn clear(&mut self) {
        self.liquidity_net = 0;
        self.liquidity_gross = 0;
        self.fee_growth_outside_0_x64 = 0;
        self.fee_growth_outside_1_x64 = 0;
        self.reward_growths_outside_x64 = [0; REWARD_NUM];
    }

    pub fn is_initialized(self) -> bool {
        self.liquidity_gross != 0
    }

    /// Common checks for a valid tick input.
    /// A tick is valid if it lies within tick boundaries
    pub fn check_is_out_of_boundary(tick: i32) -> bool {
        tick < tick_math::MIN_TICK || tick > tick_math::MAX_TICK
    }
}

pub fn check_tick_array_start_index(
    tick_array_start_index: i32,
    tick_index: i32,
    tick_spacing: u16,
) -> Result<()> {
    require!(
        tick_index >= tick_math::MIN_TICK,
        StabbleErrorCode::TickLowerOverflow
    );
    require!(
        tick_index <= tick_math::MAX_TICK,
        StabbleErrorCode::TickUpperOverflow
    );
    require_eq!(0, tick_index % i32::from(tick_spacing));
    let expect_start_index = TickArrayState::get_array_start_index(tick_index, tick_spacing);
    require_eq!(tick_array_start_index, expect_start_index);
    Ok(())
}

/// Common checks for valid tick inputs.
///
pub fn check_ticks_order(tick_lower_index: i32, tick_upper_index: i32) -> Result<()> {
    require!(
        tick_lower_index < tick_upper_index,
        StabbleErrorCode::TickInvalidOrder
    );
    Ok(())
}
