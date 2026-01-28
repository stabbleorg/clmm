use std::{
    cell::{Ref, RefMut},
    convert::identity,
    ops::{Deref, DerefMut}
};

use crate::error::ErrorCode as StabbleErrorCode;
use anchor_lang::{prelude::*, system_program, Discriminator};
use arrayref::array_ref;
use crate::libraries::{MAX_TICK, MIN_TICK};
use crate::states::{DynamicTickArray, DynamicTickArrayLoader, FixedTickArray, PoolState, RewardInfo, Tick, TickUpdate, REWARD_NUM};

pub const TICK_ARRAY_SEED: &str = "tick_array";
pub const TICK_ARRAY_SIZE: i32 = 60;
pub const TICK_ARRAY_SIZE_USIZE: usize = 60;

pub trait TickArrayType {
    fn is_variable_size(&self) -> bool;
    fn start_tick_index(&self) -> i32;
    fn pool(&self) -> Pubkey;

    fn initialized_tick_count(&self) -> u8;

    fn get_next_init_tick_index(
        &self,
        tick_index: i32,
        tick_spacing: u16,
        a_to_b: bool,
    ) -> Result<Option<i32>>;

    fn get_tick(&self, tick_index: i32, tick_spacing: u16) -> Result<Tick>;

    fn update_tick(
        &mut self,
        tick_index: i32,
        tick_spacing: u16,
        update: &TickUpdate,
    ) -> Result<bool>;

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
    ) -> Result<()>;

    /// Checks that this array holds the next tick index for the current tick index, given the pool's tick spacing & search direction.
    ///
    /// unshifted checks on [start, start + TICK_ARRAY_SIZE * tick_spacing)
    /// shifted checks on [start - tick_spacing, start + (TICK_ARRAY_SIZE - 1) * tick_spacing) (adjusting range by -tick_spacing)
    ///
    /// shifted == !a_to_b
    ///
    /// For a_to_b swaps, price moves left. All searchable ticks in this tick-array's range will end up in this tick's usable ticks.
    /// The search range is therefore the range of the tick-array.
    ///
    /// For b_to_a swaps, this tick-array's left-most ticks can be the 'next' usable tick-index of the previous tick-array.
    /// The right-most ticks also points towards the next tick-array. The search range is therefore shifted by 1 tick-spacing.
    fn in_search_range(&self, tick_index: i32, tick_spacing: u16, shifted: bool) -> bool {
        let mut lower = self.start_tick_index();
        let mut upper = self.start_tick_index() + TICK_ARRAY_SIZE * tick_spacing as i32;
        if shifted {
            lower -= tick_spacing as i32;
            upper -= tick_spacing as i32;
        }
        tick_index >= lower && tick_index < upper
    }

    fn check_in_array_bounds(&self, tick_index: i32, tick_spacing: u16) -> bool {
        self.in_search_range(tick_index, tick_spacing, false)
    }

    fn is_min_tick_array(&self) -> bool {
        self.start_tick_index() <= MIN_TICK
    }

    fn is_max_tick_array(&self, tick_spacing: u16) -> bool {
        self.start_tick_index() + TICK_ARRAY_SIZE * (tick_spacing as i32) > MAX_TICK
    }

    fn tick_offset(&self, tick_index: i32, tick_spacing: u16) -> Result<isize> {
        if tick_spacing == 0 {
            return Err(StabbleErrorCode::InvalidTickSpacing.into());
        }

        Ok(get_offset(
            tick_index,
            self.start_tick_index(),
            tick_spacing,
        ))
    }
}

fn get_offset(tick_index: i32, start_tick_index: i32, tick_spacing: u16) -> isize {
    // TODO: replace with i32.div_floor once not experimental (Comes from: https://github.com/orca-so/whirlpools/blob/3edef232f5e688082e6780a129689ef94d44d278/programs/whirlpool/src/state/tick_array.rs#L89)
    let lhs = tick_index - start_tick_index;
    // rhs(tick_spacing) is always positive number (non zero)
    let rhs = tick_spacing as i32;
    let d = lhs / rhs;
    let r = lhs % rhs;
    let o = if r < 0 { d - 1 } else { d };
    o as isize
}

pub type LoadedTickArray<'a> = Ref<'a, dyn TickArrayType>;

pub fn load_tick_array<'a>(
    account: &'a AccountInfo<'_>,
    pool: &Pubkey,
) -> Result<LoadedTickArray<'a>> {
    if *account.owner != crate::ID {
        return Err(ErrorCode::AccountOwnedByWrongProgram.into());
    }

    let data = account.try_borrow_data()?;

    if data.len() < 8 {
        return Err(ErrorCode::AccountDiscriminatorNotFound.into());
    }

    let discriminator = array_ref![data, 0, 8];
    let tick_array: LoadedTickArray<'a> = if discriminator == FixedTickArray::DISCRIMINATOR {
        Ref::map(data, |data| {
            let tick_array: &FixedTickArray = bytemuck::from_bytes(&data[8..]);
            tick_array
        })
    } else if discriminator == DynamicTickArray::DISCRIMINATOR {
        Ref::map(data, |data| {
            let tick_array: &DynamicTickArrayLoader = DynamicTickArrayLoader::load(&data[8..]);
            tick_array
        })
    } else {
        return Err(ErrorCode::AccountDiscriminatorMismatch.into());
    };

    if tick_array.pool() != *pool {
        return Err(StabbleErrorCode::DifferentPoolTickArrayAccount.into());
    }

    Ok(tick_array)
}

pub type LoadedTickArrayMut<'a> = RefMut<'a, dyn TickArrayType>;

pub fn load_tick_array_mut<'a, 'info>(
    account: &'a AccountInfo<'info>,
    pool: &Pubkey,
) -> Result<LoadedTickArrayMut<'a>> {
    if !account.is_writable {
        return Err(ErrorCode::AccountNotMutable.into());
    }

    if *account.owner != crate::ID {
        return Err(ErrorCode::AccountOwnedByWrongProgram.into());
    }

    let data = account.try_borrow_mut_data()?;

    if data.len() < 8 {
        return Err(ErrorCode::AccountDiscriminatorNotFound.into());
    }

    let discriminator = array_ref![data, 0, 8];
    let tick_array: LoadedTickArrayMut<'a> = if discriminator == FixedTickArray::DISCRIMINATOR {
        RefMut::map(data, |data| {
            let tick_array: &mut FixedTickArray =
                bytemuck::from_bytes_mut(&mut data.deref_mut()[8..]);
            tick_array
        })
    } else if discriminator == DynamicTickArray::DISCRIMINATOR {
        RefMut::map(data, |data| {
            let tick_array: &mut DynamicTickArrayLoader =
                DynamicTickArrayLoader::load_mut(&mut data.deref_mut()[8..]);
            tick_array
        })
    } else {
        return Err(ErrorCode::AccountDiscriminatorMismatch.into());
    };

    if tick_array.pool() != *pool {
        return Err(StabbleErrorCode::DifferentPoolTickArrayAccount.into());
    }

    Ok(tick_array)
}

/// In increase and decrease liquidity, we directly load the tick arrays mutably.
/// Lower and upper ticker arrays might refer to the same account. We cannot load
/// the same account mutably twice so we just return None if the accounts are the same.
pub struct TickArraysMut<'a> {
    lower_tick_array_ref: LoadedTickArrayMut<'a>,
    upper_tick_array_ref: Option<LoadedTickArrayMut<'a>>,
}

impl<'a> TickArraysMut<'a> {
    pub fn load(
        lower_tick_array_info: &'a AccountInfo<'_>,
        upper_tick_array_info: &'a AccountInfo<'_>,
        pool: &Pubkey,
    ) -> Result<Self> {
        let lower_tick_array = load_tick_array_mut(lower_tick_array_info, pool)?;
        let upper_tick_array = if lower_tick_array_info.key() == upper_tick_array_info.key() {
            None
        } else {
            Some(load_tick_array_mut(upper_tick_array_info, pool)?)
        };
        Ok(Self {
            lower_tick_array_ref: lower_tick_array,
            upper_tick_array_ref: upper_tick_array,
        })
    }

    pub fn deref(&self) -> (&dyn TickArrayType, &dyn TickArrayType) {
        if let Some(upper_tick_array_ref) = &self.upper_tick_array_ref {
            (
                self.lower_tick_array_ref.deref(),
                upper_tick_array_ref.deref(),
            )
        } else {
            (
                self.lower_tick_array_ref.deref(),
                self.lower_tick_array_ref.deref(),
            )
        }
    }

    /// Returns mutable references to the inner `LoadedTickArrayMut` values.
    /// This allows passing the `RefMut` directly to functions that need to modify the tick arrays.
    pub fn get_mut_refs(&mut self) -> (&mut LoadedTickArrayMut<'a>, Option<&mut LoadedTickArrayMut<'a>>) {
        (
            &mut self.lower_tick_array_ref,
            self.upper_tick_array_ref.as_mut(),
        )
    }
}

// Calculates the fee growths inside of tick_lower and tick_upper based on their positions relative to tick_current.
/// `fee_growth_inside = fee_growth_global - fee_growth_below(lower) - fee_growth_above(upper)`
///
pub fn get_fee_growth_inside(
    tick_lower_index: i32,
    tick_upper_index: i32,
    tick_current: i32,
    fee_growth_global_0_x64: u128,
    fee_growth_global_1_x64: u128,
    lower_fee_growth_outside_0_x64: u128,
    lower_fee_growth_outside_1_x64: u128,
    upper_fee_growth_outside_0_x64: u128,
    upper_fee_growth_outside_1_x64: u128,
) -> (u128, u128) {
    // calculate fee growth below
    let (fee_growth_below_0_x64, fee_growth_below_1_x64) = if tick_current >= tick_lower_index {
        (
            lower_fee_growth_outside_0_x64,
            lower_fee_growth_outside_1_x64,
        )
    } else {
        (
            fee_growth_global_0_x64
                .checked_sub(lower_fee_growth_outside_0_x64)
                .unwrap(),
            fee_growth_global_1_x64
                .checked_sub(lower_fee_growth_outside_1_x64)
                .unwrap(),
        )
    };

    // Calculate fee growth above
    let (fee_growth_above_0_x64, fee_growth_above_1_x64) = if tick_current < tick_upper_index {
        (
            upper_fee_growth_outside_0_x64,
            upper_fee_growth_outside_1_x64,
        )
    } else {
        (
            fee_growth_global_0_x64
                .checked_sub(upper_fee_growth_outside_0_x64)
                .unwrap(),
            fee_growth_global_1_x64
                .checked_sub(upper_fee_growth_outside_1_x64)
                .unwrap(),
        )
    };
    let fee_growth_inside_0_x64 = fee_growth_global_0_x64
        .wrapping_sub(fee_growth_below_0_x64)
        .wrapping_sub(fee_growth_above_0_x64);
    let fee_growth_inside_1_x64 = fee_growth_global_1_x64
        .wrapping_sub(fee_growth_below_1_x64)
        .wrapping_sub(fee_growth_above_1_x64);

    (fee_growth_inside_0_x64, fee_growth_inside_1_x64)
}

// Calculates the reward growths inside of tick_lower and tick_upper based on their positions relative to tick_current.
pub fn get_reward_growths_inside(
    tick_lower_index: i32,
    tick_upper_index: i32,
    lower_reward_growths_outside_x64: [u128; REWARD_NUM],
    upper_reward_growths_outside_x64: [u128; REWARD_NUM],
    tick_current_index: i32,
    reward_infos: &[RewardInfo; REWARD_NUM],
) -> [u128; REWARD_NUM] {
    let mut reward_growths_inside = [0; REWARD_NUM];

    for i in 0..REWARD_NUM {
        if !reward_infos[i].initialized() {
            continue;
        }

        let reward_growths_below = if tick_current_index >= tick_lower_index {
            lower_reward_growths_outside_x64[i]
        } else {
            reward_infos[i]
                .reward_growth_global_x64
                .checked_sub(lower_reward_growths_outside_x64[i])
                .unwrap()
        };

        let reward_growths_above = if tick_current_index < tick_upper_index {
            upper_reward_growths_outside_x64[i]
        } else {
            reward_infos[i]
                .reward_growth_global_x64
                .checked_sub(upper_reward_growths_outside_x64[i])
                .unwrap()
        };
        reward_growths_inside[i] = reward_infos[i]
            .reward_growth_global_x64
            .wrapping_sub(reward_growths_below)
            .wrapping_sub(reward_growths_above);
        #[cfg(feature = "enable-log")]
        msg!(
            "get_reward_growths_inside,i:{},reward_growth_global:{},reward_growth_below:{},reward_growth_above:{}, reward_growth_inside:{}",
            i,
            identity(reward_infos[i].reward_growth_global_x64),
            reward_growths_below,
            reward_growths_above,
            reward_growths_inside[i]
        );
    }

    reward_growths_inside
}

// Why not use anchor's `init-if-needed` to create?
// Beacuse `tick_array_lower` and `tick_array_upper` can be the same account, anchor can initialze tick_array_lower, but it causes a crash when anchor to initialze the `tick_array_upper`,
// the problem is variable scope, tick_array_lower_loader not exit to save the discriminator while build tick_array_upper_loader.
// Helper function to get or create tick array based on discriminator
pub fn get_or_create_tick_array_by_discriminator<'info>(
    payer: AccountInfo<'info>,
    tick_array_account_info: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
    pool_state_loader: &AccountLoader<'info, PoolState>,
    tick_array_start_index: i32,
    tick_spacing: u16,
) -> Result<AccountInfo<'info>> {
    // Check if account exists and has a discriminator
    let is_dynamic = if tick_array_account_info.owner == &system_program::ID {
        // Account doesn't exist yet - default to fixed for backward compatibility
        false
    } else {
        // Account exists - check discriminator
        let account_data = tick_array_account_info.try_borrow_data()?;
        if account_data.len() < 8 {
            return Err(crate::error::ErrorCode::AccountDiscriminatorNotFound.into());
        }
        let discriminator = array_ref![account_data, 0, 8];
        discriminator == &DynamicTickArray::DISCRIMINATOR
    };

    if is_dynamic {
        DynamicTickArrayLoader::get_or_create_tick_array(
            payer,
            tick_array_account_info,
            system_program,
            pool_state_loader,
            tick_array_start_index,
            tick_spacing,
        )
    } else {
        FixedTickArray::get_or_create_tick_array(
            payer,
            tick_array_account_info,
            system_program,
            pool_state_loader,
            tick_array_start_index,
            tick_spacing,
        ).map(|loader| loader.to_account_info())
    }
}