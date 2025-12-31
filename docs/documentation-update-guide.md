# Documentation Update Guide

This guide helps AI agents quickly determine which documentation files need updating based on the type of task completed.

**When to use this guide:**
- When the user explicitly requests documentation updates
- Before ending a session where significant features were added
- NOT after every small change or bug fix

---

## Quick Reference Matrix

| Task Type | AGENTS.md | GAME_MANUAL.md | card-creation-guide.md | quest-system-guide.md | CLAUDE.md |
|-----------|:---------:|:--------------:|:----------------------:|:---------------------:|:---------:|
| New Card | ✓ | ✓ | - | - | - |
| New Action | ✓ | ✓ | - | - | ✓ |
| New Quest | ✓ | ✓ | - | ✓ | - |
| New targetSelectMode | ✓ | - | ✓ | - | - |
| New Game Setting | ✓ | - | - | - | ✓ |
| New UI Component | ✓ | - | - | - | - |
| New Sound/Asset System | ✓ | - | - | - | - |
| Build Command Change | - | - | - | - | ✓ |

---

## File Purposes

### `/AGENTS.md`
**Purpose:** Technical reference for the codebase architecture, file locations, and implementation details.

**Update when:**
- Adding new cards (update targetSelectMode list if new mode added)
- Adding new actions (add section under "Dungeon Actions")
- Adding new quests (add to quest table)
- Adding new game mechanics (alliances, freeze, etc.)
- Adding new UI components or systems
- Changing file structure or adding new directories
- Adding new configuration options

### `/GAME_MANUAL.md`
**Purpose:** Player-facing documentation explaining game mechanics and how to play.

**Update when:**
- Adding new cards (add to appropriate card table: Passive, Active, or Item)
- Adding new actions (add to Dungeon Actions table)
- Adding new quests (add to Quest table)
- Changing game rules or mechanics
- Adding new player-visible features

### `/docs/card-creation-guide.md`
**Purpose:** Developer guide for implementing new cards.

**Update when:**
- Adding new `targetSelectMode` values
- Changing card lifecycle hooks
- Modifying card activation flow
- Adding new card effect patterns

### `/docs/quest-system-guide.md`
**Purpose:** Developer guide for implementing quests.

**Update when:**
- Adding new quest types
- Changing quest reward structures
- Modifying quest progress tracking
- Adding new quest-related mechanics

### `/CLAUDE.md`
**Purpose:** Quick reference for Claude Code with build commands and high-level architecture.

**Update when:**
- Adding new build/dev commands
- Changing directory structure significantly
- Adding new major features that affect development workflow
- Updating key configuration files

---

## Task-Specific Checklists

### Adding a New Card

1. **GAME_MANUAL.md** - Add to the appropriate card table:
   - Passive Cards: Cards with automatic per-turn effects
   - Active Cards: Cards requiring manual activation
   - Item Cards: Cards used for interactions/crafting

2. **AGENTS.md** - If the card introduces a new `targetSelectMode`:
   - Update the `targetSelectMode` values list in the Card System section

3. **docs/card-creation-guide.md** - If new `targetSelectMode`:
   - Update both mentions in sections 2 and 4

### Adding a New Action

1. **AGENTS.md** - Add new section under "Dungeon Actions":
   - Include Logic path, Mechanic description, Standard/Upgraded effects, Visuals

2. **GAME_MANUAL.md** - Add row to Dungeon Actions table:
   - Action name, Cost/Trigger, Effect, Upgraded Effect

3. **CLAUDE.md** - If the action has a dedicated feature directory:
   - Update Key Directories section

### Adding a New Quest

1. **AGENTS.md** - Add row to Current Quests table:
   - Quest name, Target, Reward

2. **GAME_MANUAL.md** - Add row to Quest table:
   - Quest Name, Objective, Reward

3. **docs/quest-system-guide.md** - If new quest patterns:
   - Update implementation examples

### Adding a New Game Setting

1. **AGENTS.md** - Update Game Settings System section:
   - Add to appropriate category under Configurable Mechanics

2. **CLAUDE.md** - If significant setting:
   - Update Game Settings System section

### Adding a New targetSelectMode

1. **AGENTS.md** - Update the `targetSelectMode` values list

2. **docs/card-creation-guide.md** - Update both mentions:
   - Section 2: Card catalog & draw weights
   - Section 4: Game hook & activation flow

---

## Card Table Templates

### GAME_MANUAL.md - Active Card Entry
```markdown
| **Card Name** | Description of what the card does. Use **bold** for key values and mechanics. |
```

### GAME_MANUAL.md - Passive Card Entry
```markdown
| **Card Name** | Passive effect description. Mention trigger timing and values. |
```

### AGENTS.md - targetSelectMode Entry
```markdown
`'mode_name'` (brief description of the modal/flow)
```

---

## Verification Checklist

After updating documentation:

1. [ ] Run `npm run build` to ensure no code errors
2. [ ] Verify markdown formatting renders correctly
3. [ ] Check that all cross-references are consistent
4. [ ] Ensure new entries are alphabetically ordered (where applicable)
5. [ ] Confirm technical details match the implementation
