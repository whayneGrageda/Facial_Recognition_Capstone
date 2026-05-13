/**
 * AI INSIGHTS SERVICE
 * Uses Gemini AI to generate intelligent insights and recommendations for attendance reports
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface AttendanceInsight {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export const AIInsightsService = {
  /**
   * Generate AI insights for attendance report
   */
  generateAttendanceInsights: async (
    stats: { Normal: number; Abnormal: number; Dangerous: number },
    analysisData: any[],
    dateRange?: { start: string; end: string }
  ): Promise<AttendanceInsight> => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      // Prepare data summary for AI
      const totalRecords = stats.Normal + stats.Abnormal + stats.Dangerous;
      const abnormalRate = ((stats.Abnormal / totalRecords) * 100).toFixed(1);
      const dangerousRate = ((stats.Dangerous / totalRecords) * 100).toFixed(1);

      // Get detailed problematic cases
      const problematicCases = analysisData
        .filter((record: any) => record.status === 'Dangerous' || record.status === 'Abnormal')
        .map((record: any) => ({
          status: record.status,
          statement: record.statement,
          user_type: record.user_type,
          user_id: record.user_id,
          name: record.name,
          date: record.date,
          duration: record.duration,
        }));

      const prompt = `You are an expert security analyst reviewing attendance data from a facial recognition system at an educational institution. Analyze the following data and provide detailed, actionable insights.

**ATTENDANCE STATISTICS:**
- Total Records Analyzed: ${totalRecords}
- Normal Patterns: ${stats.Normal} (${((stats.Normal / totalRecords) * 100).toFixed(1)}%)
- Abnormal Patterns: ${stats.Abnormal} (${abnormalRate}%)
- Dangerous Patterns: ${stats.Dangerous} (${dangerousRate}%)
${dateRange ? `- Analysis Period: ${dateRange.start} to ${dateRange.end}` : '- Analysis Period: Recent data'}

**FLAGGED CASES (${problematicCases.length} total):**
${problematicCases.slice(0, 15).map((c: any, i: number) => 
  `${i + 1}. [${c.status.toUpperCase()}] ${c.name} (ID: ${c.user_id}, ${c.user_type})
   Date: ${c.date} | Duration: ${c.duration}
   Issue: ${c.statement}`
).join('\n\n')}

**YOUR TASK:**
Provide a comprehensive security and behavioral analysis with:

1. **Executive Summary** (3-4 sentences):
   - Overall assessment of attendance patterns
   - Primary concerns identified
   - Urgency level and recommended timeline for action

2. **Key Findings** (7-10 specific observations):
   - Identify patterns (e.g., "12 users showed rapid entry/exit behavior suggesting badge sharing")
   - Quantify risks (e.g., "93 alternating patterns in single session indicates systematic gaming")
   - Note temporal patterns (e.g., "Suspicious activity concentrated during lunch hours")
   - Highlight user type trends (e.g., "College students account for 80% of anomalies")
   - Compare to normal behavior baselines
   - Identify potential security vulnerabilities
   - Note any systemic issues vs individual cases
   - Provide statistical context and percentages
   - Highlight severity and urgency of issues
   - Note any correlations or patterns across multiple users

3. **Risk Level Assessment**:
   - Choose: "low", "medium", "high", or "critical"
   - Base on: severity of patterns, number of users affected, potential for abuse, security implications

**IMPORTANT CONTEXT:**
- Rapid alternating time-in/out = likely badge sharing or system gaming
- Multiple entries per minute = possible malicious behavior or system exploit
- Late night access = potential security concern
- Missing time-outs = incomplete records or user error
- Very short durations = possible false attendance

**OUTPUT FORMAT (JSON only, no markdown):**
{
  "summary": "Your 3-4 sentence executive summary here",
  "keyFindings": [
    "Detailed finding 1 with specific numbers and context",
    "Detailed finding 2 with specific numbers and context",
    "Detailed finding 3 with specific numbers and context",
    "Detailed finding 4 with specific numbers and context",
    "Detailed finding 5 with specific numbers and context",
    "Detailed finding 6 with specific numbers and context",
    "Detailed finding 7 with specific numbers and context"
  ],
  "recommendations": [],
  "riskLevel": "high"
}

Be specific, professional, and analytical. Use actual numbers from the data. Focus on identifying patterns and security implications.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('AI Response:', text); // Debug log

      // Parse JSON response - try multiple methods
      let insights: AttendanceInsight | null = null;
      
      // Method 1: Direct JSON parse
      try {
        insights = JSON.parse(text);
      } catch (e) {
        // Method 2: Extract JSON from markdown code blocks
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          insights = JSON.parse(jsonMatch[1]);
        } else {
          // Method 3: Extract JSON object
          const objectMatch = text.match(/\{[\s\S]*\}/);
          if (objectMatch) {
            insights = JSON.parse(objectMatch[0]);
          }
        }
      }

      if (insights && insights.summary && insights.keyFindings) {
        // Ensure recommendations is empty array
        insights.recommendations = [];
        return insights;
      }

      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error generating AI insights:', error);
      
      // Enhanced fallback with actual data analysis
      const totalRecords = stats.Normal + stats.Abnormal + stats.Dangerous;
      const abnormalRate = ((stats.Abnormal / totalRecords) * 100).toFixed(1);
      const dangerousRate = ((stats.Dangerous / totalRecords) * 100).toFixed(1);
      
      const problematicCases = analysisData.filter((r: any) => 
        r.status === 'Dangerous' || r.status === 'Abnormal'
      );

      // Analyze patterns in fallback
      const rapidEntries = problematicCases.filter((r: any) => 
        r.statement.includes('Rapid') || r.statement.includes('multiple entries')
      ).length;
      
      const lateNight = problematicCases.filter((r: any) => 
        r.statement.includes('night') || r.statement.includes('Midnight')
      ).length;

      const missingTimeouts = problematicCases.filter((r: any) => 
        r.statement.includes('No time-out')
      ).length;

      return {
        summary: `Analysis of ${totalRecords} attendance records reveals ${stats.Dangerous} dangerous and ${stats.Abnormal} abnormal patterns requiring immediate attention. The ${dangerousRate}% dangerous rate indicates potential security concerns including rapid entry/exit behavior and unusual access patterns. Comprehensive review and corrective action recommended within 24-48 hours.`,
        keyFindings: [
          `Total of ${problematicCases.length} flagged cases identified out of ${totalRecords} records (${((problematicCases.length / totalRecords) * 100).toFixed(1)}% anomaly rate)`,
          `${stats.Dangerous} dangerous patterns detected, representing ${dangerousRate}% of all records - significantly above acceptable threshold`,
          rapidEntries > 0 ? `${rapidEntries} cases of rapid multiple entries detected, suggesting possible badge sharing or system gaming attempts` : 'No rapid entry patterns detected in current dataset',
          lateNight > 0 ? `${lateNight} instances of late night or midnight access requiring security verification` : 'No unusual late-night access patterns observed',
          missingTimeouts > 0 ? `${missingTimeouts} incomplete records with missing time-outs, indicating procedural compliance issues` : 'Time-out compliance is satisfactory',
          stats.Abnormal > 0 ? `${stats.Abnormal} abnormal patterns identified including short stays, early departures, and incomplete attendance days` : 'Attendance duration patterns are within normal parameters',
          `${stats.Normal} records show normal attendance behavior, establishing baseline for comparison and anomaly detection`,
          `Anomaly concentration analysis shows ${((stats.Dangerous / (stats.Dangerous + stats.Abnormal)) * 100).toFixed(0)}% of flagged cases are classified as dangerous, indicating high-severity security concerns`,
          problematicCases.length > 0 ? `Pattern analysis suggests ${problematicCases.length === 1 ? 'isolated incident' : 'multiple incidents'} requiring ${problematicCases.length === 1 ? 'targeted' : 'systematic'} investigation` : 'No significant patterns requiring investigation',
          `Overall system integrity: ${stats.Normal > totalRecords * 0.9 ? 'Excellent' : stats.Normal > totalRecords * 0.7 ? 'Good' : 'Requires Attention'} - ${((stats.Normal / totalRecords) * 100).toFixed(1)}% of records show normal behavior`
        ],
        recommendations: [],
        riskLevel: stats.Dangerous > 0 ? 'high' : stats.Abnormal > 5 ? 'medium' : 'low',
      };
    }
  },

  /**
   * Generate quick summary for dashboard
   */
  generateQuickSummary: async (recentAnomalies: any[]): Promise<string> => {
    try {
      if (recentAnomalies.length === 0) {
        return 'No recent anomalies detected. Attendance patterns are normal.';
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Summarize these recent attendance anomalies in one concise sentence (max 20 words):

${recentAnomalies.map((a: any, i: number) => `${i + 1}. ${a.type}: ${a.description}`).join('\n')}

Be brief and actionable.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating quick summary:', error);
      return `${recentAnomalies.length} anomalies detected. Review recommended.`;
    }
  },
};
