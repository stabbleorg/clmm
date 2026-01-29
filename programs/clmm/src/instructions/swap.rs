use crate::error::ErrorCode;
use crate::libraries::{
    big_num::U128, fixed_point_64, full_math::MulDiv, liquidity_math, swap_math, tick_math,
};
use crate::states::*;
use crate::util::*;
use anchor_lang::{prelude::*, solana_program};
use anchor_spl::token::{Token, TokenAccount};
use std::cell::RefMut;
use std::collections::VecDeque;
#[cfg(feature = "enable-log")]
use std::convert::identity;
use std::ops::{Deref, Neg};

// the top level state of the swap, the results of which are recorded in storage at the end
#[derive(Debug)]
pub struct SwapState {
    // the amount remaining to be swapped in/out of the input/output asset
    pub amount_specified_remaining: u64,
    // the amount already swapped out/in of the output/input asset
    pub amount_calculated: u64,
    // current sqrt(price)
    pub sqrt_price_x64: u128,
    // the tick associated with the current price
    pub tick: i32,
    // the global fee growth of the input token
    pub fee_growth_global_x64: u128,
    // the global fee of the input token
    pub fee_amount: u64,
    // amount of input token paid as protocol fee
    pub protocol_fee: u64,
    // amount of input token paid as fund fee
    pub fund_fee: u64,
    // the current liquidity in range
    pub liquidity: u128,
}

#[derive(Default)]
struct StepComputations {
    // the price at the beginning of the step
    sqrt_price_start_x64: u128,
    // the next tick to swap to from the current tick in the swap direction
    tick_next: i32,
    // whether tick_next is initialized or not
    initialized: bool,
    // sqrt(price) for the next tick (1/0)
    sqrt_price_next_x64: u128,
    // how much is being swapped in in this step
    amount_in: u64,
    // how much is being swapped out
    amount_out: u64,
    // how much fee is being paid in
    fee_amount: u64,
}

pub fn swap_internal<'b, 'info>(
    amm_config: &AmmConfig,
    pool_state: &mut RefMut<PoolState>,
    tick_array_states: &mut VecDeque<LoadedTickArrayMut<'info>>,
    observation_state: &mut RefMut<ObservationState>,
    tickarray_bitmap_extension: &Option<TickArrayBitmapExtension>,
    amount_specified: u64,
    sqrt_price_limit_x64: u128,
    zero_for_one: bool,
    is_base_input: bool,
    block_timestamp: u32,
) -> Result<(u64, u64)> {
    require!(amount_specified != 0, ErrorCode::ZeroAmountSpecified);
    if !pool_state.get_status_by_bit(PoolStatusBitIndex::Swap) {
        return err!(ErrorCode::NotApproved);
    }
    require!(
        if zero_for_one {
            sqrt_price_limit_x64 < pool_state.sqrt_price_x64
                && sqrt_price_limit_x64 > tick_math::MIN_SQRT_PRICE_X64
        } else {
            sqrt_price_limit_x64 > pool_state.sqrt_price_x64
                && sqrt_price_limit_x64 < tick_math::MAX_SQRT_PRICE_X64
        },
        ErrorCode::SqrtPriceLimitOverflow
    );

    let liquidity_start = pool_state.liquidity;

    let updated_reward_infos = pool_state.update_reward_infos(block_timestamp as u64)?;

    let mut state = SwapState {
        amount_specified_remaining: amount_specified,
        amount_calculated: 0,
        sqrt_price_x64: pool_state.sqrt_price_x64,
        tick: pool_state.tick_current,
        fee_growth_global_x64: if zero_for_one {
            pool_state.fee_growth_global_0_x64
        } else {
            pool_state.fee_growth_global_1_x64
        },
        fee_amount: 0,
        protocol_fee: 0,
        fund_fee: 0,
        liquidity: liquidity_start,
    };

    // check observation account is owned by the pool
    require_keys_eq!(observation_state.pool_id, pool_state.key());

    let (mut is_match_pool_current_tick_array, first_valid_tick_array_start_index) =
        pool_state.get_first_initialized_tick_array(&tickarray_bitmap_extension, zero_for_one)?;
    let mut current_valid_tick_array_start_index = first_valid_tick_array_start_index;

    let mut tick_array_current = tick_array_states.pop_front().unwrap();
    // find the first active tick array account
    for _ in 0..tick_array_states.len() {
        if tick_array_current.start_tick_index() == current_valid_tick_array_start_index {
            break;
        }
        tick_array_current = tick_array_states
            .pop_front()
            .ok_or(ErrorCode::NotEnoughTickArrayAccount)?;
    }
    // check the first tick_array account is owned by the pool
    require_keys_eq!(tick_array_current.pool(), pool_state.key());
    // check first tick array account is correct
    require_eq!(
        tick_array_current.start_tick_index(),
        current_valid_tick_array_start_index,
        ErrorCode::InvalidFirstTickArrayAccount
    );

    // continue swapping as long as we haven't used the entire input/output and haven't
    // reached the price limit
    while state.amount_specified_remaining != 0 && state.sqrt_price_x64 != sqrt_price_limit_x64 {
        #[cfg(feature = "enable-log")]
        msg!(
            "while begin, is_base_input:{},fee_growth_global_x32:{}, state_sqrt_price_x64:{}, state_tick:{},state_liquidity:{},state.protocol_fee:{}, protocol_fee_rate:{}",
            is_base_input,
            state.fee_growth_global_x64,
            state.sqrt_price_x64,
            state.tick,
            state.liquidity,
            state.protocol_fee,
            amm_config.protocol_fee_rate
        );
        // Save these three pieces of information for PriceChangeEvent
        // let tick_before = state.tick;
        // let sqrt_price_x64_before = state.sqrt_price_x64;
        // let liquidity_before = state.liquidity;

        let mut step = StepComputations::default();
        step.sqrt_price_start_x64 = state.sqrt_price_x64;

        // Get next initialized tick using trait methods
        let mut next_tick_index = tick_array_current
            .get_next_initialized_tick_index_for_swap(state.tick, pool_state.tick_spacing, zero_for_one)?;
        let mut next_tick: Tick = if let Some(tick_idx) = next_tick_index {
            tick_array_current.get_tick(tick_idx, pool_state.tick_spacing)?
        } else {
            if !is_match_pool_current_tick_array {
                is_match_pool_current_tick_array = true;
                if let Some(first_tick_idx) = tick_array_current.get_first_initialized_tick_index(pool_state.tick_spacing, zero_for_one)? {
                    next_tick_index = Some(first_tick_idx);
                    tick_array_current.get_tick(first_tick_idx, pool_state.tick_spacing)?
                } else {
                    Tick::default()
                }
            } else {
                Tick::default()
            }
        };
        #[cfg(feature = "enable-log")]
        msg!(
            "next_initialized_tick, status:{}, tick_index:{}, tick_array_start:{}",
            next_tick.initialized,
            next_tick_index.unwrap_or(0),
            tick_array_current.start_tick_index(),
        );
        if !next_tick.initialized {
            let next_initialized_tickarray_index = pool_state
                .next_initialized_tick_array_start_index(
                    &tickarray_bitmap_extension,
                    current_valid_tick_array_start_index,
                    zero_for_one,
                )?;
            if next_initialized_tickarray_index.is_none() {
                return err!(ErrorCode::LiquidityInsufficient);
            }

            while tick_array_current.start_tick_index() != next_initialized_tickarray_index.unwrap() {
                tick_array_current = tick_array_states
                    .pop_front()
                    .ok_or(ErrorCode::NotEnoughTickArrayAccount)?;
                // check the tick_array account is owned by the pool
                require_keys_eq!(tick_array_current.pool(), pool_state.key());
            }
            current_valid_tick_array_start_index = next_initialized_tickarray_index.unwrap();

            if let Some(first_tick_idx) = tick_array_current.get_first_initialized_tick_index(pool_state.tick_spacing, zero_for_one)? {
                next_tick_index = Some(first_tick_idx);
                next_tick = tick_array_current.get_tick(first_tick_idx, pool_state.tick_spacing)?;
            } else {
                return err!(ErrorCode::LiquidityInsufficient);
            }
        }
        // Ensure we have a valid tick index
        let tick_next = next_tick_index.ok_or(ErrorCode::LiquidityInsufficient)?;
        step.tick_next = tick_next;
        step.initialized = next_tick.initialized;

        if step.tick_next < tick_math::MIN_TICK {
            step.tick_next = tick_math::MIN_TICK;
        } else if step.tick_next > tick_math::MAX_TICK {
            step.tick_next = tick_math::MAX_TICK;
        }
        step.sqrt_price_next_x64 = tick_math::get_sqrt_price_at_tick(step.tick_next)?;

        let target_price = if (zero_for_one && step.sqrt_price_next_x64 < sqrt_price_limit_x64)
            || (!zero_for_one && step.sqrt_price_next_x64 > sqrt_price_limit_x64)
        {
            sqrt_price_limit_x64
        } else {
            step.sqrt_price_next_x64
        };

        if zero_for_one {
            require_gte!(state.tick, step.tick_next);
            require_gte!(step.sqrt_price_start_x64, step.sqrt_price_next_x64);
            require_gte!(step.sqrt_price_start_x64, target_price);
        } else {
            require_gt!(step.tick_next, state.tick);
            require_gte!(step.sqrt_price_next_x64, step.sqrt_price_start_x64);
            require_gte!(target_price, step.sqrt_price_start_x64);
        }
        #[cfg(feature = "enable-log")]
        msg!(
            "sqrt_price_current_x64:{}, sqrt_price_target:{}, liquidity:{}, amount_remaining:{}",
            step.sqrt_price_start_x64,
            target_price,
            state.liquidity,
            state.amount_specified_remaining
        );
        let swap_step = swap_math::compute_swap_step(
            step.sqrt_price_start_x64,
            target_price,
            state.liquidity,
            state.amount_specified_remaining,
            amm_config.trade_fee_rate,
            is_base_input,
            zero_for_one,
            block_timestamp,
        )?;
        #[cfg(feature = "enable-log")]
        msg!("{:#?}", swap_step);
        if zero_for_one {
            require_gte!(swap_step.sqrt_price_next_x64, target_price);
        } else {
            require_gte!(target_price, swap_step.sqrt_price_next_x64);
        }
        state.sqrt_price_x64 = swap_step.sqrt_price_next_x64;
        step.amount_in = swap_step.amount_in;
        step.amount_out = swap_step.amount_out;
        step.fee_amount = swap_step.fee_amount;

        if is_base_input {
            state.amount_specified_remaining = state
                .amount_specified_remaining
                .checked_sub(step.amount_in + step.fee_amount)
                .unwrap();
            state.amount_calculated = state
                .amount_calculated
                .checked_add(step.amount_out)
                .unwrap();
        } else {
            state.amount_specified_remaining = state
                .amount_specified_remaining
                .checked_sub(step.amount_out)
                .unwrap();

            let step_amount_calculate = step
                .amount_in
                .checked_add(step.fee_amount)
                .ok_or(ErrorCode::CalculateOverflow)?;
            state.amount_calculated = state
                .amount_calculated
                .checked_add(step_amount_calculate)
                .ok_or(ErrorCode::CalculateOverflow)?;
        }

        let step_fee_amount = step.fee_amount;
        // if the protocol fee is on, calculate how much is owed, decrement fee_amount, and increment protocol_fee
        if amm_config.protocol_fee_rate > 0 {
            let delta = U128::from(step_fee_amount)
                .checked_mul(amm_config.protocol_fee_rate.into())
                .unwrap()
                .checked_div(FEE_RATE_DENOMINATOR_VALUE.into())
                .unwrap()
                .as_u64();
            step.fee_amount = step.fee_amount.checked_sub(delta).unwrap();
            state.protocol_fee = state.protocol_fee.checked_add(delta).unwrap();
        }
        // if the fund fee is on, calculate how much is owed, decrement fee_amount, and increment fund_fee
        if amm_config.fund_fee_rate > 0 {
            let delta = U128::from(step_fee_amount)
                .checked_mul(amm_config.fund_fee_rate.into())
                .unwrap()
                .checked_div(FEE_RATE_DENOMINATOR_VALUE.into())
                .unwrap()
                .as_u64();
            step.fee_amount = step.fee_amount.checked_sub(delta).unwrap();
            state.fund_fee = state.fund_fee.checked_add(delta).unwrap();
        }

        // update global fee tracker
        if state.liquidity > 0 {
            let fee_growth_global_x64_delta = U128::from(step.fee_amount)
                .mul_div_floor(U128::from(fixed_point_64::Q64), U128::from(state.liquidity))
                .unwrap()
                .as_u128();

            state.fee_growth_global_x64 = state
                .fee_growth_global_x64
                .checked_add(fee_growth_global_x64_delta)
                .unwrap();
            state.fee_amount = state.fee_amount.checked_add(step.fee_amount).unwrap();
            #[cfg(feature = "enable-log")]
            msg!(
                "fee_growth_global_x64_delta:{}, state.fee_growth_global_x64:{}, state.liquidity:{}, step.fee_amount:{}, state.fee_amount:{}",
                fee_growth_global_x64_delta,
                state.fee_growth_global_x64, state.liquidity, step.fee_amount, state.fee_amount
            );
        }
        // shift tick if we reached the next price
        if state.sqrt_price_x64 == step.sqrt_price_next_x64 {
            // if the tick is initialized, run the tick transition
            if step.initialized {
                #[cfg(feature = "enable-log")]
                msg!("loading next tick {}", step.tick_next);

                // Cross the tick using trait method
                let mut liquidity_net = tick_array_current.cross_tick(
                    step.tick_next,
                    pool_state.tick_spacing,
                    if zero_for_one {
                        state.fee_growth_global_x64
                    } else {
                        pool_state.fee_growth_global_0_x64
                    },
                    if zero_for_one {
                        pool_state.fee_growth_global_1_x64
                    } else {
                        state.fee_growth_global_x64
                    },
                    &updated_reward_infos,
                )?;

                if zero_for_one {
                    liquidity_net = liquidity_net.neg();
                }
                state.liquidity = liquidity_math::add_delta(state.liquidity, liquidity_net)?;
            }

            state.tick = if zero_for_one {
                step.tick_next - 1
            } else {
                step.tick_next
            };
        } else if state.sqrt_price_x64 != step.sqrt_price_start_x64 {
            // recompute unless we're on a lower tick boundary (i.e. already transitioned ticks), and haven't moved
            // if only a small amount of quantity is traded, the input may be consumed by fees, resulting in no price change. If state.sqrt_price_x64, i.e., the latest price in the pool, is used to recalculate the tick, some errors may occur.
            // for example, if zero_for_one, and the price falls exactly on an initialized tick t after the first trade, then at this point, pool.sqrtPriceX64 = get_sqrt_price_at_tick(t), while pool.tick = t-1. if the input quantity of the
            // second trade is very small and the pool price does not change after the transaction, if the tick is recalculated, pool.tick will be equal to t, which is incorrect.
            state.tick = tick_math::get_tick_at_sqrt_price(state.sqrt_price_x64)?;
        }

        #[cfg(feature = "enable-log")]
        msg!(
            "end, is_base_input:{},step_amount_in:{}, step_amount_out:{}, step_fee_amount:{},fee_growth_global_x32:{}, state_sqrt_price_x64:{}, state_tick:{}, state_liquidity:{},state.protocol_fee:{}, protocol_fee_rate:{}, state.fund_fee:{}, fund_fee_rate:{}",
            is_base_input,
            step.amount_in,
            step.amount_out,
            step.fee_amount,
            state.fee_growth_global_x64,
            state.sqrt_price_x64,
            state.tick,
            state.liquidity,
            state.protocol_fee,
            amm_config.protocol_fee_rate,
            state.fund_fee,
            amm_config.fund_fee_rate,
        );
        // emit!(PriceChangeEvent {
        //     pool_state: pool_state.key(),
        //     tick_before,
        //     tick_after: state.tick,
        //     sqrt_price_x64_before,
        //     sqrt_price_x64_after: state.sqrt_price_x64,
        //     liquidity_before,
        //     liquidity_after: state.liquidity,
        //     zero_for_one,
        // });
    }
    // update tick
    if state.tick != pool_state.tick_current {
        // update the previous tick to the observation
        observation_state.update(block_timestamp, pool_state.tick_current);
        pool_state.tick_current = state.tick;
    }
    pool_state.sqrt_price_x64 = state.sqrt_price_x64;

    if liquidity_start != state.liquidity {
        pool_state.liquidity = state.liquidity;
    }

    let (amount_0, amount_1) = if zero_for_one == is_base_input {
        (
            amount_specified
                .checked_sub(state.amount_specified_remaining)
                .unwrap(),
            state.amount_calculated,
        )
    } else {
        (
            state.amount_calculated,
            amount_specified
                .checked_sub(state.amount_specified_remaining)
                .unwrap(),
        )
    };

    if zero_for_one {
        pool_state.fee_growth_global_0_x64 = state.fee_growth_global_x64;
        pool_state.total_fees_token_0 = pool_state
            .total_fees_token_0
            .checked_add(state.fee_amount)
            .unwrap();

        if state.protocol_fee > 0 {
            pool_state.protocol_fees_token_0 = pool_state
                .protocol_fees_token_0
                .checked_add(state.protocol_fee)
                .unwrap();
        }
        if state.fund_fee > 0 {
            pool_state.fund_fees_token_0 = pool_state
                .fund_fees_token_0
                .checked_add(state.fund_fee)
                .unwrap();
        }
        pool_state.swap_in_amount_token_0 = pool_state
            .swap_in_amount_token_0
            .checked_add(u128::from(amount_0))
            .unwrap();
        pool_state.swap_out_amount_token_1 = pool_state
            .swap_out_amount_token_1
            .checked_add(u128::from(amount_1))
            .unwrap();
    } else {
        pool_state.fee_growth_global_1_x64 = state.fee_growth_global_x64;
        pool_state.total_fees_token_1 = pool_state
            .total_fees_token_1
            .checked_add(state.fee_amount)
            .unwrap();

        if state.protocol_fee > 0 {
            pool_state.protocol_fees_token_1 = pool_state
                .protocol_fees_token_1
                .checked_add(state.protocol_fee)
                .unwrap();
        }
        if state.fund_fee > 0 {
            pool_state.fund_fees_token_1 = pool_state
                .fund_fees_token_1
                .checked_add(state.fund_fee)
                .unwrap();
        }
        pool_state.swap_in_amount_token_1 = pool_state
            .swap_in_amount_token_1
            .checked_add(u128::from(amount_1))
            .unwrap();
        pool_state.swap_out_amount_token_0 = pool_state
            .swap_out_amount_token_0
            .checked_add(u128::from(amount_0))
            .unwrap();
    }

    Ok((amount_0, amount_1))
}
