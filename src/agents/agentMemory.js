/**
 * @file agentMemory.js
 * @description Session-scoped conversation memory for the Trial Radar AI Agent.
 *
 * AGENT ROLE: Memory Module
 *
 * The Memory module implements a lightweight, in-process knowledge store that
 * persists across agent turns within a single browser session. It enables:
 *
 *   1. CONTEXT CARRY-OVER: The agent can refer to previously fetched trials or
 *      drugs in follow-up questions ("tell me more about the first result").
 *
 *   2. ENTITY TRACKING: Named entities (drugs, companies, conditions) extracted
 *      from prior turns are cached and re-used in subsequent tool calls, reducing
 *      redundant API fetches.
 *
 *   3. TURN HISTORY: Last N turns are stored for context window management.
 *      The orchestrator uses this to detect follow-up patterns (e.g., the user
 *      asking a clarifying question about a previously mentioned trial).
 *
 * DESIGN: Memory is intentionally client-side only (no persistence layer).
 * It resets on page refresh. For production, this would be replaced by a
 * server-side session store or a vector DB for semantic memory retrieval.
 *
 * EXTENSION POINT: This module is the ideal integration point for a RAG
 * (Retrieval-Augmented Generation) pipeline — replace `getRelevantContext()`
 * with an embedding-based similarity search over prior conversation chunks.
 */

// ---------------------------------------------------------------------------
// Memory Store (module-level singleton — lives for the session duration)
// ---------------------------------------------------------------------------
const memoryStore = {
  // Conversation history: Array of { role: 'user'|'agent', content, timestamp }
  turns: [],

  // Named entity cache: maps entity type → last mentioned value
  // Populated by the Orchestrator when it parses successful tool results
  entities: {
    lastCondition:   null,  // e.g., "breast cancer"
    lastSponsor:     null,  // e.g., "Pfizer"
    lastDrug:        null,  // e.g., "Keytruda"
    lastCompany:     null,  // e.g., "Roche"
    lastPhase:       null,  // e.g., "PHASE3"
  },

  // Tool result cache: stores last N tool outputs by tool name
  // Allows follow-up questions to access previous results without re-fetching
  toolResultCache: {},

  // Session-level patient profile — persists after first eligibility check
  // so the user doesn't need to re-enter their details for follow-ups
  patientProfile: null
};

// Maximum number of conversation turns to retain in memory
const MAX_TURNS = 20;

// ---------------------------------------------------------------------------
// MEMORY API
// ---------------------------------------------------------------------------

/**
 * addTurn({ role, content })
 * Records a new conversation turn to memory.
 *
 * @param {string} role    - 'user' or 'agent'
 * @param {string} content - Text content of the turn
 */
export const addTurn = ({ role, content }) => {
  memoryStore.turns.push({
    role,
    content,
    timestamp: new Date().toISOString()
  });
  // Rolling window: evict oldest turns when limit is exceeded
  if (memoryStore.turns.length > MAX_TURNS) {
    memoryStore.turns.shift();
  }
};

/**
 * getRecentTurns(n)
 * Returns the last N conversation turns for context window construction.
 *
 * @param {number} n - Number of turns to return (default: 5)
 * @returns {Array}  Recent turns in chronological order
 */
export const getRecentTurns = (n = 5) =>
  memoryStore.turns.slice(-n);

/**
 * updateEntity(key, value)
 * Updates a named entity in the entity cache.
 * Called by the Orchestrator after successful tool calls.
 *
 * @param {string} key   - Entity key (must be a key of memoryStore.entities)
 * @param {string} value - Entity value extracted from tool result or query
 */
export const updateEntity = (key, value) => {
  if (key in memoryStore.entities) {
    memoryStore.entities[key] = value;
  }
};

/**
 * getEntity(key)
 * Retrieves a cached entity value. Used for context resolution in follow-up queries.
 * Example: user says "tell me more about its side effects" — agent resolves
 * "it" → getEntity('lastDrug').
 *
 * @param {string} key - Entity key
 * @returns {string|null} Cached entity value or null
 */
export const getEntity = (key) => memoryStore.entities[key] || null;

/**
 * cacheToolResult(toolName, result)
 * Stores a tool's output for later retrieval without re-calling the API.
 *
 * @param {string} toolName - Tool identifier
 * @param {any}    result   - Tool output to cache
 */
export const cacheToolResult = (toolName, result) => {
  memoryStore.toolResultCache[toolName] = { result, timestamp: Date.now() };
};

/**
 * getCachedToolResult(toolName, maxAgeMs)
 * Retrieves a cached tool result if it's still fresh.
 *
 * @param {string} toolName  - Tool identifier
 * @param {number} maxAgeMs  - Maximum acceptable cache age in ms (default: 30s)
 * @returns {any|null} Cached result or null if stale/absent
 */
export const getCachedToolResult = (toolName, maxAgeMs = 30000) => {
  const entry = memoryStore.toolResultCache[toolName];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > maxAgeMs) return null; // Cache miss (stale)
  return entry.result;
};

/**
 * savePatientProfile(profile)
 * Persists a patient profile for the session.
 * Allows follow-up eligibility queries without re-specifying age/gender/condition.
 *
 * @param {object} profile - { age, gender, conditions[], symptoms }
 */
export const savePatientProfile = (profile) => {
  memoryStore.patientProfile = profile;
};

/**
 * getPatientProfile()
 * Returns the session-level patient profile, or null if not yet established.
 *
 * @returns {object|null} Patient profile or null
 */
export const getPatientProfile = () => memoryStore.patientProfile;

/**
 * clearMemory()
 * Resets all memory state. Called when the user starts a new session
 * or explicitly clears the conversation.
 */
export const clearMemory = () => {
  memoryStore.turns             = [];
  memoryStore.entities          = { lastCondition: null, lastSponsor: null, lastDrug: null, lastCompany: null, lastPhase: null };
  memoryStore.toolResultCache   = {};
  memoryStore.patientProfile    = null;
};

/**
 * getMemorySnapshot()
 * Returns a read-only snapshot of the full memory state.
 * Used by the Orchestrator for debugging and step logging.
 *
 * @returns {object} Deep copy of memory store
 */
export const getMemorySnapshot = () => ({
  turnCount:      memoryStore.turns.length,
  entities:       { ...memoryStore.entities },
  hasCachedTools: Object.keys(memoryStore.toolResultCache),
  hasProfile:     !!memoryStore.patientProfile
});
