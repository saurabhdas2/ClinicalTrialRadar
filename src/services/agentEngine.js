/**
 * @file agentEngine.js
 * @description Public API adapter for the Clinical Trial Radar multi-agent system.
 *
 * ROLE: Facade / Backward-Compatibility Layer
 *
 * This module acts as the single public entry point for the agent system,
 * re-exporting the new multi-agent architecture behind a stable API surface.
 * All callers (AgentPanel.jsx, EligibilityMatcher.jsx) import from here —
 * not from the individual agent modules directly.
 *
 * BENEFITS OF THIS PATTERN:
 *  1. Backward compatibility — existing callers need no changes when the
 *     underlying agent architecture is upgraded or replaced.
 *  2. Single import — UI components have one import to manage.
 *  3. Testability — this module can be mocked in unit tests independently
 *     of the orchestrator and tool registry.
 *
 * ARCHITECTURE SUMMARY:
 *
 *   agentEngine.js (this file)
 *       │
 *       ├── runAgentQuery()        → orchestrator.runOrchestrator()
 *       ├── evaluateEligibility()  → eligibilityAgent.evaluateEligibility()
 *       ├── parseAgeToYears()      → eligibilityAgent.parseAgeToYears()
 *       └── clearAgentMemory()     → agentMemory.clearMemory()
 *
 * For a full architectural overview, see:
 *   src/agents/orchestrator.js    — ReAct Orchestrator Agent
 *   src/agents/eligibilityAgent.js — Eligibility Scoring Sub-Agent
 *   src/agents/agentMemory.js     — Session Memory Module
 *   src/agents/toolRegistry.js    — Tool Registry (8 registered tools)
 */

export { runOrchestrator as runAgentQuery } from '../agents/orchestrator';
export { evaluateEligibility, parseAgeToYears } from '../agents/eligibilityAgent';
export { clearMemory as clearAgentMemory } from '../agents/agentMemory';
