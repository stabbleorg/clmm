use anchor_lang::prelude::*;
use crate::states::DynamicTickArray;

// This struct is only here so that DynamicTickArray is included in the IDL.
// Anchor only adds accounts to the IDL if they are used in at least one instruction.
// DynamicTickArray uses a fixed-size array [DynamicTick; TICK_ARRAY_SIZE_USIZE] for IDL generation.
#[derive(Accounts)]
pub struct IdlInclude<'info> {
    /// DynamicTickArray account - only used for IDL generation
    pub dynamic_tick_array: Account<'info, DynamicTickArray>,
    pub system_program: Program<'info, System>,
}

pub fn idl_include(_ctx: Context<IdlInclude>) -> Result<()> {
    // Dummy instruction - never actually called, only exists to include account types in IDL
    Ok(())
}
