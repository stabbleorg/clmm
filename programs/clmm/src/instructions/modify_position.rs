use std::cell::RefMut;
use anchor_lang::prelude::{msg, AccountInfo};
use crate::instructions::LiquidityChangeResult;
use crate::libraries;
use crate::states::{get_fee_growth_inside, get_reward_growths_inside, LoadedTickArrayMut, PoolState, RewardInfo, TickArrayType, TickUpdate};
#[cfg(feature = "enable-log")]
use std::convert::identity;
use crate::libraries::liquidity_math;

pub fn modify_position<'info>(
    liquidity_delta: i128,
    pool_state: &mut RefMut<PoolState>,
    tick_lower_array: &mut LoadedTickArrayMut,
    mut tick_upper_array: Option<&mut LoadedTickArrayMut>,
    tick_lower_index: i32,
    tick_upper_index: i32,
    timestamp: u64,
    tick_lower_account_info: Option<&AccountInfo<'info>>,
    tick_upper_account_info: Option<&AccountInfo<'info>>,
) -> anchor_lang::Result<LiquidityChangeResult> {
    let updated_reward_infos = pool_state.update_reward_infos(timestamp)?;

    let mut flipped_lower = false;
    let mut flipped_upper = false;
    
    // Check if both ticks are in the same array
    let is_same_array = tick_upper_array.is_none();
    
    let tick_lower = &tick_lower_array.get_tick(tick_lower_index, pool_state.tick_spacing)?.clone();
    let tick_upper = if is_same_array {
        // Both ticks are in the same array
        &tick_lower_array.get_tick(tick_upper_index, pool_state.tick_spacing)?.clone()
    } else {
        // Upper tick is in a different array
        &tick_upper_array.as_ref().unwrap().get_tick(tick_upper_index, pool_state.tick_spacing)?.clone()
    };

    // Precompute liquidity after for TickUpdates and for initialization-from-globals logic
    let lower_liquidity_gross_after =
        liquidity_math::add_delta(tick_lower.liquidity_gross, liquidity_delta)?;
    let upper_liquidity_gross_after =
        liquidity_math::add_delta(tick_upper.liquidity_gross, liquidity_delta)?;

    // When a tick is first initialized, fee_growth_outside must be set to global fee growth if tick_index <= tick_current (convention: growth before init happened below the tick).
    let (lower_fee_0, lower_fee_1, lower_rewards) = if tick_lower.liquidity_gross == 0
        && lower_liquidity_gross_after != 0
        && tick_lower_index <= pool_state.tick_current
    {
        (
            pool_state.fee_growth_global_0_x64,
            pool_state.fee_growth_global_1_x64,
            RewardInfo::get_reward_growths(&updated_reward_infos),
        )
    } else {
        (
            tick_lower.fee_growth_outside_0_x64,
            tick_lower.fee_growth_outside_1_x64,
            tick_lower.reward_growths_outside,
        )
    };

    let (upper_fee_0, upper_fee_1, upper_rewards) = if tick_upper.liquidity_gross == 0
        && upper_liquidity_gross_after != 0
        && tick_upper_index <= pool_state.tick_current
    {
        (
            pool_state.fee_growth_global_0_x64,
            pool_state.fee_growth_global_1_x64,
            RewardInfo::get_reward_growths(&updated_reward_infos),
        )
    } else {
        (
            tick_upper.fee_growth_outside_0_x64,
            tick_upper.fee_growth_outside_1_x64,
            tick_upper.reward_growths_outside,
        )
    };

    // update the ticks if liquidity delta is non-zero
    if liquidity_delta != 0 {
        let lower_liquidity_net_after = tick_lower.liquidity_net
            .checked_add(liquidity_delta)
            .unwrap();
        let lower_tick_update = &TickUpdate {
            initialized: lower_liquidity_gross_after != 0,
            liquidity_net: lower_liquidity_net_after,
            liquidity_gross: lower_liquidity_gross_after,
            fee_growth_outside_0_x64: lower_fee_0,
            fee_growth_outside_1_x64: lower_fee_1,
            reward_growths_outside: lower_rewards,
        };
        // Update tick state and find if tick is flipped
        flipped_lower = tick_lower_array.update_tick(tick_lower_index, pool_state.tick_spacing, lower_tick_update, tick_lower_account_info)?;

        let upper_liquidity_net_after = tick_upper.liquidity_net
            .checked_sub(liquidity_delta)
            .unwrap();
        let upper_tick_update = &TickUpdate {
            initialized: upper_liquidity_gross_after != 0,
            liquidity_net: upper_liquidity_net_after,
            liquidity_gross: upper_liquidity_gross_after,
            fee_growth_outside_0_x64: upper_fee_0,
            fee_growth_outside_1_x64: upper_fee_1,
            reward_growths_outside: upper_rewards,
        };

        // Update upper tick - use the same array if both ticks are in the same array
        match tick_upper_array {
            None => {
                // Both ticks are in the same array
                flipped_upper = tick_lower_array.update_tick(tick_upper_index, pool_state.tick_spacing, upper_tick_update, tick_lower_account_info)?;
            }
            Some(ref mut upper_array) => {
                // Upper tick is in a different array
                flipped_upper = upper_array.update_tick(tick_upper_index, pool_state.tick_spacing, upper_tick_update, tick_upper_account_info)?;
            }
        }

        #[cfg(feature = "enable-log")]
        msg!(
            "tick_upper.reward_growths_outside_x64:{:?}, tick_lower.reward_growths_outside_x64:{:?}",
            identity(tick_upper.reward_growths_outside),
            identity(tick_lower.reward_growths_outside)
        );
    }

    // Update fees (use effective outside values so newly initialized ticks get correct fee accounting)
    let (fee_growth_inside_0_x64, fee_growth_inside_1_x64) = get_fee_growth_inside(
        tick_lower_index,
        tick_upper_index,
        pool_state.tick_current,
        pool_state.fee_growth_global_0_x64,
        pool_state.fee_growth_global_1_x64,
        lower_fee_0,
        lower_fee_1,
        upper_fee_0,
        upper_fee_1,
    );

    // Update reward outside if needed (use effective outside values for correct reward accounting)
    let reward_growths_inside = get_reward_growths_inside(
        tick_lower_index,
        tick_upper_index,
        lower_rewards,
        upper_rewards,
        pool_state.tick_current,
        &updated_reward_infos,
    );

    if liquidity_delta < 0 {
        if flipped_lower {
            tick_lower_array.clear_tick(tick_lower_index, pool_state.tick_spacing);
        }
        if flipped_upper {
            match tick_upper_array {
                None => {
                    // Both ticks are in the same array
                    tick_lower_array.clear_tick(tick_upper_index, pool_state.tick_spacing);
                }
                Some(ref mut upper_array) => {
                    // Upper tick is in a different array
                    upper_array.clear_tick(tick_upper_index, pool_state.tick_spacing);
                }
            }
        }
    }

    let mut amount_0 = 0;
    let mut amount_1 = 0;

    if liquidity_delta != 0 {
        (amount_0, amount_1) = libraries::get_delta_amounts_signed(
            pool_state.tick_current,
            pool_state.sqrt_price_x64,
            tick_lower_index,
            tick_upper_index,
            liquidity_delta,
        )?;
        if pool_state.tick_current >= tick_lower_index
            && pool_state.tick_current < tick_upper_index
        {
            pool_state.liquidity =
                libraries::add_delta(pool_state.liquidity, liquidity_delta)?;
        }
    }

    Ok(LiquidityChangeResult {
        amount_0: amount_0,
        amount_1: amount_1,
        amount_0_transfer_fee: 0,
        amount_1_transfer_fee: 0,
        tick_lower_flipped: flipped_lower,
        tick_upper_flipped: flipped_upper,
        fee_growth_inside_0_x64: fee_growth_inside_0_x64,
        fee_growth_inside_1_x64: fee_growth_inside_1_x64,
        reward_growths_inside: reward_growths_inside,
    })
}