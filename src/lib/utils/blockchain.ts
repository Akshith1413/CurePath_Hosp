import crypto from "crypto";
import { supabase } from "../supabaseServer";

/**
 * Generate SHA256 hash from record data, previous hash, and timestamp
 */
export const generateHash = (recordData: any, previousHash: string, timestamp: string) => {
  const dataStr = typeof recordData === "object" ? JSON.stringify(recordData) : String(recordData);
  const dataToHash = dataStr + String(previousHash) + String(timestamp);
  return crypto.createHash("sha256").update(dataToHash).digest("hex");
};

/**
 * Helper to fetch the latest hash in the blockchain log chain for a specific hospital node
 */
export const getLatestHashForHospital = async (hospitalId: string) => {
  try {
    const { data, error } = await supabase
      .from("blockchain_logs")
      .select("current_hash")
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    if (data && data.length > 0) {
      return data[0].current_hash;
    }
    // Genesis block previous hash
    return "0x0000000000000000000000000000000000000000000000000000000000000000";
  } catch (err: any) {
    console.error("Error fetching latest hash:", err.message || err);
    return "0x0000000000000000000000000000000000000000000000000000000000000000";
  }
};

/**
 * Create a new blockchain verification log
 */
export const createBlockchainRecord = async (
  hospitalId: string,
  recordType: string,
  recordId: string | null,
  actionType: string,
  recordData: any,
  verifiedStatus = "VALID"
) => {
  try {
    const timestamp = new Date().toISOString();
    const prevHash = await getLatestHashForHospital(hospitalId);
    const currHash = generateHash(recordData, prevHash, timestamp);

    const { data, error } = await supabase
      .from("blockchain_logs")
      .insert([
        {
          hospital_id: hospitalId,
          record_type: recordType,
          record_id: recordId || null,
          current_hash: currHash,
          previous_hash: prevHash,
          action_type: actionType,
          verified_status: verifiedStatus,
          metadata: recordData || null,
          created_at: timestamp
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, log: data };
  } catch (err: any) {
    console.error("Failed to create blockchain record:", err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Verify the integrity of the entire blockchain logs for a hospital node
 */
export const verifyChainIntegrity = async (hospitalId: string) => {
  try {
    const { data: logs, error } = await supabase
      .from("blockchain_logs")
      .select("*")
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: true }); // Verify chronologically

    if (error) throw error;
    if (!logs || logs.length === 0) {
      return { success: true, verified: true, count: 0 };
    }

    let expectedPrevHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      // 1. Verify previous_hash link match
      if (log.previous_hash !== expectedPrevHash) {
        return {
          success: true,
          verified: false,
          failedBlockId: log.id,
          reason: `Previous hash mismatch at Block index ${i}. Expected: ${expectedPrevHash.substring(0, 16)}..., Found: ${log.previous_hash.substring(0, 16)}...`
        };
      }

      // 2. Verify current block's hash correctness
      const computedHash = generateHash(log.metadata, log.previous_hash, log.created_at);
      if (computedHash !== log.current_hash) {
        return {
          success: true,
          verified: false,
          failedBlockId: log.id,
          reason: `Hash corruption detected at Block index ${i}. Stored current_hash: ${log.current_hash.substring(0, 16)}..., Computed: ${computedHash.substring(0, 16)}...`
        };
      }

      // Set expected previous hash for next block
      expectedPrevHash = log.current_hash;
    }

    return { success: true, verified: true, count: logs.length };
  } catch (err: any) {
    console.error("Chain Integrity Audit Failed:", err.message || err);
    return { success: false, error: err.message || err };
  }
};
