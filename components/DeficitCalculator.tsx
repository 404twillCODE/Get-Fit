"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { loadAppData, updateAppData } from "@/lib/dataStore";

interface NutritionData {
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
  fiber: number;
  sodium: number;
  calcium: number;
}

interface FitnessData {
  totalCalories: number;
  exercise: string;
  standHours: number;
  steps: number;
  distance: number;
}

interface DeficitEntry {
  date: string;
  nutrition?: NutritionData;
  fitness?: FitnessData;
  caloriesEaten: number;
  caloriesBurned: number;
  deficit: number;
}

const DeficitCalculator = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<DeficitEntry[]>([]);
  const [stats, setStats] = useState({ week: 0, month: 0, year: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentEntry, setCurrentEntry] = useState<DeficitEntry | null>(null);
  const [showNutritionForm, setShowNutritionForm] = useState(false);
  const [showFitnessForm, setShowFitnessForm] = useState(false);
  const [rawOcrText, setRawOcrText] = useState<string>("");
  const [showRawText, setShowRawText] = useState(false);
  const nutritionFileRef = useRef<HTMLInputElement>(null);
  const fitnessFileRef = useRef<HTMLInputElement>(null);

  // Form states
  const [nutritionData, setNutritionData] = useState<NutritionData>({
    calories: 0,
    fat: 0,
    carbs: 0,
    protein: 0,
    fiber: 0,
    sodium: 0,
    calcium: 0,
  });
  const [fitnessData, setFitnessData] = useState<FitnessData>({
    totalCalories: 0,
    exercise: "",
    standHours: 0,
    steps: 0,
    distance: 0,
  });

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    loadTodayData();
    calculateStats();
  }, [currentDate, entries]);

  const formatDateKey = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const loadEntries = async () => {
    const data = await loadAppData();
    setEntries(data.deficitEntries);
  };

  const loadTodayData = () => {
    const dateKey = formatDateKey(currentDate);
    const entry = entries.find((e) => e.date === dateKey);
    if (entry) {
      setCurrentEntry(entry);
      if (entry.nutrition) setNutritionData(entry.nutrition);
      if (entry.fitness) setFitnessData(entry.fitness);
    } else {
      setCurrentEntry(null);
      setNutritionData({
        calories: 0,
        fat: 0,
        carbs: 0,
        protein: 0,
        fiber: 0,
        sodium: 0,
        calcium: 0,
      });
      setFitnessData({
        totalCalories: 0,
        exercise: "",
        standHours: 0,
        steps: 0,
        distance: 0,
      });
    }
  };

  const parseNutritionLabel = (text: string): NutritionData => {
    const data: NutritionData = {
      calories: 0,
      fat: 0,
      carbs: 0,
      protein: 0,
      fiber: 0,
      sodium: 0,
      calcium: 0,
    };

    // Extract calories - handles "2,421cals", "Calories 2,421", "2,421 cals"
    // Also handles OCR errors where comma might be missing
    const caloriesMatch = text.match(/(?:calories|cal)\s*:?\s*(\d{1,4}(?:,\d{3})*)\s*cals?/i);
    if (caloriesMatch) {
      data.calories = parseInt(caloriesMatch[1].replace(/,/g, ""));
    }

    // Extract fat - handles "96g", "Fat 96g", "964" (OCR error where "g" is read as "4")
    // OCR sometimes reads "g" as "4" or "9", so we look for reasonable values
    const fatMatch = text.match(/(?:^|\s)(?:fat|total\s*fat)\s*:?\s*(\d{1,4}(?:,\d{3})*)\s*(?:g|[49])/i);
    if (fatMatch) {
      let fatValue = parseInt(fatMatch[1].replace(/,/g, ""));
      // If OCR misread "g" as "4" or "9", fix it
      // Common patterns: 964 -> 96g, 9649 -> 96g, 964 -> 96g
      if (fatValue > 100 && fatValue < 10000) {
        // If ends with 4 or 49, likely "g" was misread
        if (fatValue % 10 === 4) {
          fatValue = Math.floor(fatValue / 10);
        } else if (fatValue % 100 === 49) {
          fatValue = Math.floor(fatValue / 100);
        } else if (fatValue > 1000) {
          // Try to extract reasonable 2-digit value
          const str = fatValue.toString();
          if (str.length === 4 && str[2] === '4') {
            fatValue = parseInt(str.substring(0, 2));
          }
        }
      }
      // Cap at reasonable max (e.g., 200g)
      if (fatValue > 200) {
        fatValue = Math.floor(fatValue / 10);
      }
      data.fat = fatValue;
    }

    // Extract carbs - handles "279g", "T. Carbs 279g", "2799" (OCR error)
    const carbsMatch = text.match(/(?:t\.?\s*carbs?|total\s*carbohydrate|carbohydrates|carbs)\s*:?\s*(\d{1,4}(?:,\d{3})*)\s*(?:g|9)/i);
    if (carbsMatch) {
      let carbsValue = parseInt(carbsMatch[1].replace(/,/g, ""));
      // Fix OCR errors (e.g., 2799 -> 279)
      if (carbsValue > 1000 && carbsValue % 100 === 99) {
        carbsValue = Math.floor(carbsValue / 100);
      }
      data.carbs = carbsValue;
    }

    // Extract protein - handles "109g", "Protein 109g", "1099" (OCR error)
    const proteinMatch = text.match(/(?:^|\s)protein\s*:?\s*(\d{1,4}(?:,\d{3})*)\s*(?:g|9)/i);
    if (proteinMatch) {
      let proteinValue = parseInt(proteinMatch[1].replace(/,/g, ""));
      // Fix OCR errors (e.g., 1099 -> 109)
      if (proteinValue > 1000 && proteinValue % 100 === 99) {
        proteinValue = Math.floor(proteinValue / 100);
      }
      data.protein = proteinValue;
    }

    // Extract fiber - handles "10g", "Fiber 10g", "0 g", "Fiber 0 g"
    // Also handles OCR errors where "g" might be misread or "Fiber" might be misread
    // First, look for pattern "Xg, Y% target" near "Fiber" (this is more reliable)
    const fiberIndex = text.toLowerCase().indexOf("fiber");
    if (fiberIndex !== -1) {
      // Look in wider context - before and after "Fiber"
      const context = text.substring(Math.max(0, fiberIndex - 50), fiberIndex + 100);
      console.log("Fiber detection - full context around 'fiber':", context);
      
      // Look for pattern like "i 109g, 28% target" or "10g, 28% target" (common format)
      // Pattern: optional "i" or "1" or "l", then number, then "g", then comma, then percentage, then "target"
      let contextMatch = context.match(/(?:i|1|l|I)\s+(\d{2,3})g\s*,\s*\d+\s*%\s*target/i);
      if (!contextMatch) {
        // Try without the prefix character
        contextMatch = context.match(/(\d{1,2})g\s*,\s*\d+\s*%\s*target/i);
      }
      if (!contextMatch) {
        // Try more flexible: any number followed by g, comma, percentage, target
        contextMatch = context.match(/(\d{2,3})g\s*,\s*\d+\s*%\s*target/i);
      }
      if (contextMatch) {
        let fiberValue = parseInt(contextMatch[1]);
        console.log("Fiber detection - found pattern match:", contextMatch[0], "extracted:", fiberValue);
        // Fix OCR errors: 109g -> 10g, 104g -> 10g, etc.
        if (fiberValue >= 100 && fiberValue <= 199) {
          fiberValue = Math.floor(fiberValue / 10);
          console.log("Fiber detection - corrected OCR error:", contextMatch[1], "->", fiberValue);
        } else if (fiberValue >= 10 && fiberValue <= 99) {
          // Already correct
        } else if (fiberValue >= 200) {
          fiberValue = Math.floor(fiberValue / 100);
        }
        if (fiberValue >= 0 && fiberValue <= 100) {
          data.fiber = fiberValue;
          console.log("Fiber detection - setting fiber to:", fiberValue);
          return data;
        }
      } else {
        console.log("Fiber detection - no pattern match found in context");
      }
    }
    
    // Fallback: Try standard "Fiber X g" patterns
    let fiberMatch = text.match(/(?:^|\s)(?:dietary\s*)?fiber\s+(\d{1,3}(?:,\d{3})*)\s+g/i);
    if (!fiberMatch) {
      // Try: "Fiber 10g" without space between number and g
      fiberMatch = text.match(/(?:^|\s)(?:dietary\s*)?fiber\s+(\d{1,3}(?:,\d{3})*)\s*g/i);
    }
    if (!fiberMatch) {
      // Try with colon: "Fiber: 0 g"
      fiberMatch = text.match(/(?:^|\s)(?:dietary\s*)?fiber\s*:\s*(\d{1,3}(?:,\d{3})*)\s+g/i);
    }
    if (!fiberMatch) {
      // Try without "g" - OCR might have missed it, look for "Fiber X" followed by space
      fiberMatch = text.match(/(?:^|\s)(?:dietary\s*)?fiber\s+(\d{1,3}(?:,\d{3})*)\s+(?:\s|%|target|left)/i);
    }
    if (!fiberMatch) {
      // Try with OCR error patterns (g as 4, 9, etc.)
      fiberMatch = text.match(/(?:^|\s)(?:dietary\s*)?fiber\s*:?\s*(\d{1,3}(?:,\d{3})*)\s*[49]/i);
    }
    if (!fiberMatch) {
      // Try case variations and OCR errors in "Fiber" (might be "Fiber", "Fiber", etc.)
      fiberMatch = text.match(/(?:^|\s)(?:dietary\s*)?[fF][il1][b6][e3][r2]\s*:?\s*(\d{1,3}(?:,\d{3})*)\s*(?:g|[49]|\s|%)/i);
    }
    if (!fiberMatch) {
      // Look for pattern "Xg, Y% target" - find number before "% target" that's near "fiber"
      const fiberIndex = text.toLowerCase().indexOf("fiber");
      if (fiberIndex !== -1) {
        const context = text.substring(fiberIndex, fiberIndex + 80);
        console.log("Fiber detection - context after 'fiber':", context);
        // Try "Fiber 0 g" pattern first
        fiberMatch = context.match(/fiber\s+(\d{1,3}(?:,\d{3})*)\s+g/i);
        if (!fiberMatch) {
          fiberMatch = context.match(/(\d{1,3}(?:,\d{3})*)\s*(?:g|[49])\s*,\s*\d+\s*%\s*target/i);
        }
        if (!fiberMatch) {
          // Try just finding a number after "fiber" followed by "% target"
          fiberMatch = context.match(/(\d{1,3}(?:,\d{3})*)\s*%\s*target/i);
        }
        if (!fiberMatch) {
          // Try finding any number after "fiber" followed by space and then "%"
          fiberMatch = context.match(/(\d{1,3}(?:,\d{3})*)\s+%\s*target/i);
        }
        if (!fiberMatch) {
          // Look for pattern like "i 109g, 28% target" which might be misread "10g"
          const misreadMatch = context.match(/(?:i|1)\s+(\d{2,3})g\s*,\s*\d+\s*%\s*target/i);
          if (misreadMatch) {
            const num = parseInt(misreadMatch[1]);
            // If it's 109 or similar, might be 10g misread
            if (num >= 100 && num <= 199) {
              const corrected = Math.floor(num / 10);
              if (corrected >= 0 && corrected <= 100) {
                data.fiber = corrected;
                console.log("Fiber detection - corrected misread value:", num, "->", corrected);
                return data;
              }
            }
          }
        }
      }
    }
    if (!fiberMatch) {
      // Look for pattern between "Protein" and "Sodium" (fiber is usually between them)
      const proteinIndex = text.toLowerCase().indexOf("protein");
      const sodiumIndex = text.toLowerCase().indexOf("sodium");
      if (proteinIndex !== -1 && sodiumIndex !== -1 && sodiumIndex > proteinIndex) {
        const context = text.substring(proteinIndex, sodiumIndex);
        console.log("Fiber detection - context between protein and sodium:", context);
        // Try multiple patterns in this context
        fiberMatch = context.match(/(\d{1,3}(?:,\d{3})*)\s*(?:g|[49])\s*,\s*\d+\s*%\s*target/i);
        if (!fiberMatch) {
          fiberMatch = context.match(/(\d{1,3}(?:,\d{3})*)\s*%\s*target/i);
        }
        if (!fiberMatch) {
          fiberMatch = context.match(/(\d{1,2}(?:,\d{3})*)\s*(?:g|[49]|\s)/i);
        }
        if (!fiberMatch) {
          // Last resort: find any small number (0-100) in this context
          const allNumbers = Array.from(context.matchAll(/(\d{1,3}(?:,\d{3})*)/g));
          for (const match of allNumbers) {
            const num = parseInt(match[1].replace(/,/g, ""));
            if (num >= 0 && num <= 100) {
              // Check if it's followed by "g", "%", "target", or space
              const matchIndex = match.index || 0;
              const afterNum = context.substring(matchIndex + match[0].length, matchIndex + match[0].length + 10);
              if (afterNum.match(/\s*(?:g|[49]|%|target)/i)) {
                fiberMatch = match;
                console.log("Fiber detection - found number in context:", num, "after:", afterNum);
                break;
              }
            }
          }
        }
      }
    }
    if (!fiberMatch) {
      // Ultra fallback: search entire text for pattern "Xg, Y% target" where X is 0-100
      const allMatches = text.matchAll(/(\d{1,2}(?:,\d{3})*)\s*(?:g|[49])\s*,\s*\d+\s*%\s*target/gi);
      for (const match of allMatches) {
        const num = parseInt(match[1].replace(/,/g, ""));
        if (num >= 0 && num <= 100) {
          // Check if this appears near "fiber" or between protein/sodium
          const matchIndex = match.index || 0;
          const beforeMatch = text.substring(Math.max(0, matchIndex - 30), matchIndex).toLowerCase();
          if (beforeMatch.includes("fiber") || beforeMatch.includes("protein")) {
            fiberMatch = match;
            break;
          }
        }
      }
    }
    if (fiberMatch) {
      let fiberValue = parseInt(fiberMatch[1].replace(/,/g, ""));
      // Fix OCR errors
      if (fiberValue > 100 && fiberValue % 10 === 4) {
        fiberValue = Math.floor(fiberValue / 10);
      }
      // Validate reasonable fiber value (0-100g)
      if (fiberValue >= 0 && fiberValue <= 100) {
        data.fiber = fiberValue;
      }
    }

    // Extract sodium - handles "5,336mg", "Sodium 5,336mg", "Sodium 5,336mg, 232%"
    let sodiumMatch = text.match(/sodium\s*:?\s*(\d{1,4}(?:,\d{3})*)\s*mg/i);
    if (!sodiumMatch) {
      // Try with space: "Sodium 5,336 mg"
      sodiumMatch = text.match(/sodium\s+(\d{1,4}(?:,\d{3})*)\s+mg/i);
    }
    if (!sodiumMatch) {
      // Try more flexible: find number with mg after "sodium" in context
      const sodiumIndex = text.toLowerCase().indexOf("sodium");
      if (sodiumIndex !== -1) {
        const context = text.substring(sodiumIndex, sodiumIndex + 60);
        console.log("Sodium detection - context:", context);
        sodiumMatch = context.match(/(\d{1,4}(?:,\d{3})*)\s*mg/i);
        if (!sodiumMatch) {
          // Try with comma in number: "5,336mg"
          sodiumMatch = context.match(/(\d{1},\d{3})\s*mg/i);
        }
      }
    }
    if (sodiumMatch) {
      data.sodium = parseInt(sodiumMatch[1].replace(/,/g, ""));
      console.log("Sodium detection - found:", sodiumMatch[1], "->", data.sodium);
    } else {
      console.log("Sodium detection - no match found. Searching for 'sodium' in text:", text.toLowerCase().includes("sodium"));
    }

    // Extract calcium - handles "1,279mg", "Calcium 1,279mg", "Calcium 1,279mg, 128%"
    let calciumMatch = text.match(/calcium\s*:?\s*(\d{1,4}(?:,\d{3})*)\s*mg/i);
    if (!calciumMatch) {
      // Try with space: "Calcium 1,279 mg"
      calciumMatch = text.match(/calcium\s+(\d{1,4}(?:,\d{3})*)\s+mg/i);
    }
    if (!calciumMatch) {
      // Try more flexible: find number with mg after "calcium" in context
      const calciumIndex = text.toLowerCase().indexOf("calcium");
      if (calciumIndex !== -1) {
        const context = text.substring(calciumIndex, calciumIndex + 60);
        console.log("Calcium detection - context:", context);
        calciumMatch = context.match(/(\d{1,4}(?:,\d{3})*)\s*mg/i);
        if (!calciumMatch) {
          // Try with comma in number: "1,279mg"
          calciumMatch = context.match(/(\d{1},\d{3})\s*mg/i);
        }
      }
    }
    if (calciumMatch) {
      data.calcium = parseInt(calciumMatch[1].replace(/,/g, ""));
      console.log("Calcium detection - found:", calciumMatch[1], "->", data.calcium);
    } else {
      console.log("Calcium detection - no match found. Searching for 'calcium' in text:", text.toLowerCase().includes("calcium"));
    }

    return data;
  };

  const parseFitnessTracker = (text: string): FitnessData => {
    const data: FitnessData = {
      totalCalories: 0,
      exercise: "",
      standHours: 0,
      steps: 0,
      distance: 0,
    };

    // Extract total calories - prioritize "TOTAL X CAL" over "Move X/Y CAL"
    let caloriesMatch = text.match(/total\s+(\d{1,4}(?:,\d{3})*)\s*cal/i);
    if (caloriesMatch) {
      data.totalCalories = parseInt(caloriesMatch[1].replace(/,/g, ""));
    } else {
      // Fallback to "Move X/Y CAL" format - take the first number
      caloriesMatch = text.match(/move\s+(\d{1,4}(?:,\d{3})*)\s*\/\s*\d+\s*cal/i);
      if (caloriesMatch) {
        data.totalCalories = parseInt(caloriesMatch[1].replace(/,/g, ""));
      } else {
        // Last resort: any large calorie number
        caloriesMatch = text.match(/(\d{3,4}(?:,\d{3})*)\s*cal/i);
        if (caloriesMatch) {
          data.totalCalories = parseInt(caloriesMatch[1].replace(/,/g, ""));
        }
      }
    }

    // Extract exercise minutes - handles "Exercise 1/30MIN", "1/30MIN"
    const exerciseMatch = text.match(/(?:exercise|workout)\s*(\d+)\s*\/\s*\d+\s*min/i);
    if (exerciseMatch) {
      const minutes = parseInt(exerciseMatch[1]);
      data.exercise = minutes > 0 ? `${minutes} minutes` : "None";
    }

    // Extract stand hours - handles "Stand 10/12HRS", "10/12HRS"
    const standMatch = text.match(/(?:stand|standing)\s*(\d+)\s*\/\s*\d+\s*hrs?/i);
    if (standMatch) {
      data.standHours = parseInt(standMatch[1]);
    } else {
      // Fallback: look for number before HRS near "stand"
      const standContext = text.toLowerCase().indexOf("stand");
      if (standContext !== -1) {
        const standAltMatch = text.substring(standContext).match(/(\d+)\s*hrs?/i);
        if (standAltMatch) {
          data.standHours = parseInt(standAltMatch[1]);
        }
      }
    }

    // Extract steps - handles "Steps 1,602", "1,602", "Steps: 1,602"
    // Also handles cases where "Steps" might be misread
    let stepsMatch = text.match(/(?:steps?)\s*:?\s*(\d{1,4}(?:,\d{3})*)/i);
    if (!stepsMatch) {
      // Try case-insensitive with potential OCR errors (S as 5, etc.)
      stepsMatch = text.match(/(?:steps?|5teps?|5teps)\s*:?\s*(\d{1,4}(?:,\d{3})*)/i);
    }
    if (!stepsMatch) {
      // Look for pattern "1,602" near "steps" keyword (case-insensitive)
      const stepsIndex = text.toLowerCase().indexOf("step");
      if (stepsIndex !== -1) {
        const context = text.substring(Math.max(0, stepsIndex - 10), stepsIndex + 30);
        // Look for comma-separated number pattern (1,602)
        stepsMatch = context.match(/(\d{1},\d{3})/);
        if (!stepsMatch) {
          // Try 4-digit number without comma (1602)
          stepsMatch = context.match(/(\d{4})/);
        }
      }
    }
    if (!stepsMatch) {
      // Look for "Steps" followed by "Distance" and extract the number between them
      const stepsDistanceMatch = text.match(/(?:steps?|5teps?)\s*:?\s*(\d{1,4}(?:,\d{3})*)\s*(?:distance|mi|miles?)/i);
      if (stepsDistanceMatch) {
        stepsMatch = stepsDistanceMatch;
      }
    }
    if (!stepsMatch) {
      // Look for pattern where "Steps" and "Distance" are on the same line
      // Format: "Steps 1,602 Distance 0.75mi" or similar
      const stepsDistancePattern = text.match(/(?:steps?|5teps?)\s+(\d{1},\d{3})\s+(?:distance|mi|miles?)/i);
      if (stepsDistancePattern) {
        stepsMatch = stepsDistancePattern;
      }
    }
    if (stepsMatch) {
      const stepsValue = parseInt(stepsMatch[1].replace(/,/g, ""));
      // Validate it's a reasonable step count (between 100 and 100,000)
      // Also check if it looks like a step count (usually 3-5 digits, often with comma)
      if (stepsValue >= 100 && stepsValue <= 100000) {
        data.steps = stepsValue;
      } else if (stepsValue > 0 && stepsValue < 100) {
        // Might be misread, try multiplying by 10 or 100
        const possibleSteps = stepsValue * 10;
        if (possibleSteps >= 100 && possibleSteps <= 100000) {
          data.steps = possibleSteps;
        }
      }
    }

    // Extract distance - handles "Distance 0.75mi", "0.75mi", "0.75 mi"
    const distanceMatch = text.match(/(?:distance)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:mi|miles?)/i);
    if (distanceMatch) {
      data.distance = parseFloat(distanceMatch[1]);
    } else {
      // Fallback: look for decimal number with mi
      const distanceAltMatch = text.match(/(\d+\.\d+)\s*(?:mi|miles?)/i);
      if (distanceAltMatch) {
        data.distance = parseFloat(distanceAltMatch[1]);
      }
    }

    return data;
  };

  const processImage = async (file: File, type: "nutrition" | "fitness") => {
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Dynamically import Tesseract.js to avoid SSR issues
      const { createWorker } = await import("tesseract.js");
      
      console.log("Creating Tesseract worker...");
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          console.log("Tesseract progress:", m);
          if (m.status === "recognizing text") {
            setProcessingProgress(Math.round(m.progress * 100));
          } else if (m.status === "loading tesseract core") {
            setProcessingProgress(10);
          } else if (m.status === "initializing tesseract") {
            setProcessingProgress(30);
          } else if (m.status === "loading language traineddata") {
            setProcessingProgress(50);
          }
        },
      });

      console.log("Recognizing text from image...");
      setProcessingProgress(60);
      const { data } = await worker.recognize(file);
      await worker.terminate();

      console.log("Recognized text:", data.text);
      const recognizedText = data.text;
      setRawOcrText(recognizedText);

      if (!recognizedText || recognizedText.trim().length === 0) {
        throw new Error("No text was recognized from the image. Please ensure the image is clear and contains readable text.");
      }

      if (type === "nutrition") {
        const parsed = parseNutritionLabel(recognizedText);
        console.log("Parsed nutrition data:", parsed);
        console.log("Fiber detection debug - searching for 'fiber' in text:", recognizedText.toLowerCase().includes("fiber"));
        console.log("Fiber detection debug - searching for 'protein' in text:", recognizedText.toLowerCase().includes("protein"));
        console.log("Fiber detection debug - searching for 'sodium' in text:", recognizedText.toLowerCase().includes("sodium"));
        setNutritionData(parsed);
        setShowNutritionForm(true);
        setShowRawText(true);
      } else {
        const parsed = parseFitnessTracker(recognizedText);
        console.log("Parsed fitness data:", parsed);
        setFitnessData(parsed);
        setShowFitnessForm(true);
        setShowRawText(true);
      }
    } catch (error: any) {
      console.error("OCR Error:", error);
      const errorMessage = error?.message || "Failed to process image. Please try again or enter data manually.";
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const saveEntry = async () => {
    const caloriesEaten = nutritionData.calories || 0;
    const caloriesBurned = fitnessData.totalCalories || 0;
    const deficit = caloriesEaten - caloriesBurned;
    const dateKey = formatDateKey(currentDate);

    const newEntry: DeficitEntry = {
      date: dateKey,
      nutrition: nutritionData,
      fitness: fitnessData,
      caloriesEaten,
      caloriesBurned,
      deficit,
    };

    const updatedEntries = entries.filter((e) => e.date !== dateKey);
    updatedEntries.push(newEntry);
    updatedEntries.sort((a, b) => b.date.localeCompare(a.date));

    await updateAppData((current) => ({
      ...current,
      deficitEntries: updatedEntries,
    }));
    setEntries(updatedEntries);
    setCurrentEntry(newEntry);
  };

  const calculateStats = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    const weekTotal = entries
      .filter((e) => {
        const entryDate = new Date(e.date);
        return entryDate >= weekStart && entryDate <= now;
      })
      .reduce((sum, e) => sum + e.deficit, 0);

    const monthTotal = entries
      .filter((e) => {
        const entryDate = new Date(e.date);
        return (
          entryDate.getFullYear() === currentYear &&
          entryDate.getMonth() === currentMonth
        );
      })
      .reduce((sum, e) => sum + e.deficit, 0);

    const yearTotal = entries
      .filter((e) => {
        const entryDate = new Date(e.date);
        return entryDate.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.deficit, 0);

    setStats({ week: weekTotal, month: monthTotal, year: yearTotal });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    newDate.setHours(0, 0, 0, 0);
    if (newDate <= today) {
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const todayDeficit =
    (nutritionData.calories || 0) - (fitnessData.totalCalories || 0);
  const isToday = formatDateKey(currentDate) === formatDateKey(new Date());
  const canGoNext = formatDateKey(currentDate) < formatDateKey(new Date());

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12 pb-6 px-6"
      >
        <h1 className="text-3xl font-bold mb-6">Deficit Calculator</h1>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => changeDate(-1)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold hover:bg-white/10 transition-colors"
          >
            ‹
          </button>
          <div className="flex-1 text-center mx-4">
            <div className="text-lg font-semibold">
              {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
            </div>
            <div className="text-sm text-white/60">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
          <button
            onClick={() => changeDate(1)}
            disabled={!canGoNext}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
        {!isToday && (
          <button
            onClick={goToToday}
            className="w-full py-2 text-sm bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            Go to Today
          </button>
        )}
      </motion.header>

      {/* Image Upload Section */}
      <div className="px-6 mb-6 space-y-4">
        {/* Nutrition Label Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-2xl p-5 border border-white/10"
        >
          <div className="text-white/60 text-sm mb-3">📸 Nutrition Label</div>
          <div className="grid grid-cols-2 gap-2">
            <input
              ref={nutritionFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processImage(file, "nutrition");
              }}
            />
            <button
              onClick={() => nutritionFileRef.current?.click()}
              disabled={isProcessing}
              className="py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 text-sm"
            >
              📷 Upload Image
            </button>
            <button
              onClick={() => setShowNutritionForm(true)}
              className="py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              ✏️ Enter Manually
            </button>
          </div>
        </motion.div>

        {/* Fitness Tracker Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-2xl p-5 border border-white/10"
        >
          <div className="text-white/60 text-sm mb-3">⌚ Fitness Tracker</div>
          <div className="grid grid-cols-2 gap-2">
            <input
              ref={fitnessFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processImage(file, "fitness");
              }}
            />
            <button
              onClick={() => fitnessFileRef.current?.click()}
              disabled={isProcessing}
              className="py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 text-sm"
            >
              📷 Upload Image
            </button>
            <button
              onClick={() => setShowFitnessForm(true)}
              className="py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              ✏️ Enter Manually
            </button>
          </div>
        </motion.div>
      </div>

      {/* Processing Indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-6 mb-6"
          >
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-center">
              <div className="text-white/60 mb-2">Processing image with OCR...</div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <motion.div
                  className="bg-white h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${processingProgress}%` }}
                />
              </div>
              <div className="text-white/40 text-xs">{processingProgress}%</div>
              <div className="text-white/30 text-xs mt-2">This may take 10-30 seconds</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Raw OCR Text Debug View */}
      {rawOcrText && showRawText && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 mb-4"
        >
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <div className="text-white/60 text-xs">Raw OCR Text (for debugging)</div>
              <button
                onClick={() => setShowRawText(false)}
                className="text-white/40 text-xs hover:text-white"
              >
                Hide
              </button>
            </div>
            <div className="text-white/80 text-xs font-mono bg-black/20 p-3 rounded-lg max-h-32 overflow-y-auto">
              {rawOcrText || "No text recognized"}
            </div>
          </div>
        </motion.div>
      )}

      {/* Nutrition Data Form */}
      <AnimatePresence>
        {showNutritionForm && (
          <NutritionForm
            data={nutritionData}
            onChange={setNutritionData}
            onClose={() => setShowNutritionForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Fitness Data Form */}
      <AnimatePresence>
        {showFitnessForm && (
          <FitnessForm
            data={fitnessData}
            onChange={setFitnessData}
            onClose={() => setShowFitnessForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Current Data Display */}
      {(nutritionData.calories > 0 || fitnessData.totalCalories > 0) && (
        <div className="px-6 mb-6 space-y-4">
          {nutritionData.calories > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-2xl p-4 border border-white/10"
            >
              <div className="text-white/60 text-xs mb-2">Nutrition Data</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Calories: <span className="text-white font-semibold">{nutritionData.calories}</span></div>
                {nutritionData.fat > 0 && <div>Fat: <span className="text-white">{nutritionData.fat}g</span></div>}
                {nutritionData.carbs > 0 && <div>Carbs: <span className="text-white">{nutritionData.carbs}g</span></div>}
                {nutritionData.protein > 0 && <div>Protein: <span className="text-white">{nutritionData.protein}g</span></div>}
                {nutritionData.fiber > 0 && <div>Fiber: <span className="text-white">{nutritionData.fiber}g</span></div>}
                {nutritionData.sodium > 0 && <div>Sodium: <span className="text-white">{nutritionData.sodium}mg</span></div>}
                {nutritionData.calcium > 0 && <div>Calcium: <span className="text-white">{nutritionData.calcium}mg</span></div>}
              </div>
            </motion.div>
          )}

          {fitnessData.totalCalories > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-2xl p-4 border border-white/10"
            >
              <div className="text-white/60 text-xs mb-2">Fitness Data</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Calories: <span className="text-white font-semibold">{fitnessData.totalCalories}</span></div>
                {fitnessData.exercise && <div>Exercise: <span className="text-white">{fitnessData.exercise}</span></div>}
                {fitnessData.standHours > 0 && <div>Stand Hours: <span className="text-white">{fitnessData.standHours}</span></div>}
                {fitnessData.steps > 0 && <div>Steps: <span className="text-white">{fitnessData.steps.toLocaleString()}</span></div>}
                {fitnessData.distance > 0 && <div>Distance: <span className="text-white">{fitnessData.distance}mi</span></div>}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="px-6 mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={saveEntry}
          className="w-full py-4 bg-white text-[#0a0a0a] rounded-2xl font-semibold text-lg"
        >
          Save Day
        </motion.button>
      </div>

      {/* Stats Section */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-6 border border-white/10 mb-4"
        >
          <div className="text-white/60 text-sm mb-2">
            {isToday ? "Today's Deficit" : "Day's Deficit"}
          </div>
          <div
            className={`text-5xl font-bold ${
              todayDeficit <= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {todayDeficit >= 0 ? "+" : ""}
            {Math.round(todayDeficit).toLocaleString()}
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "This Week", value: stats.week },
            { label: "This Month", value: stats.month },
            { label: "This Year", value: stats.year },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center"
            >
              <div className="text-white/60 text-xs mb-2">{stat.label}</div>
              <div
                className={`text-2xl font-bold ${
                  stat.value >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stat.value >= 0 ? "+" : ""}
                {Math.round(stat.value).toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="px-6 pb-6">
        <h2 className="text-xl font-bold mb-4">Recent Days</h2>
        <div className="space-y-3">
          {entries.slice(0, 7).map((entry, index) => (
            <motion.div
              key={entry.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              onClick={() => {
                setCurrentDate(new Date(entry.date));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="bg-white/5 rounded-xl p-4 border border-white/10 active:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-sm text-white/60">
                    {entry.caloriesEaten} eaten • {entry.caloriesBurned} burned
                  </div>
                </div>
                <div
                  className={`text-xl font-bold ${
                    entry.deficit <= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {entry.deficit >= 0 ? "+" : ""}
                  {Math.round(entry.deficit)}
                </div>
              </div>
            </motion.div>
          ))}
          {entries.length === 0 && (
            <div className="text-center py-8 text-white/40">
              No entries yet. Upload images or enter data manually!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Nutrition Form Component
const NutritionForm = ({
  data,
  onChange,
  onClose,
}: {
  data: NutritionData;
  onChange: (data: NutritionData) => void;
  onClose: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="px-6 mb-4"
    >
      <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Nutrition Data</h3>
          <button onClick={onClose} className="text-white/60">
            ×
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-white/60 text-xs mb-1 block">Calories</label>
            <input
              type="number"
              value={data.calories || ""}
              onChange={(e) =>
                onChange({ ...data, calories: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">Fat (g)</label>
            <input
              type="number"
              step="0.1"
              value={data.fat || ""}
              onChange={(e) =>
                onChange({ ...data, fat: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">Carbs (g)</label>
            <input
              type="number"
              step="0.1"
              value={data.carbs || ""}
              onChange={(e) =>
                onChange({ ...data, carbs: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">Protein (g)</label>
            <input
              type="number"
              step="0.1"
              value={data.protein || ""}
              onChange={(e) =>
                onChange({ ...data, protein: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">Fiber (g)</label>
            <input
              type="number"
              step="0.1"
              value={data.fiber || ""}
              onChange={(e) =>
                onChange({ ...data, fiber: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">Sodium (mg)</label>
            <input
              type="number"
              step="0.1"
              value={data.sodium || ""}
              onChange={(e) =>
                onChange({ ...data, sodium: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">Calcium (mg)</label>
            <input
              type="number"
              step="0.1"
              value={data.calcium || ""}
              onChange={(e) =>
                onChange({ ...data, calcium: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Fitness Form Component
const FitnessForm = ({
  data,
  onChange,
  onClose,
}: {
  data: FitnessData;
  onChange: (data: FitnessData) => void;
  onClose: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="px-6 mb-4"
    >
      <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Fitness Data</h3>
          <button onClick={onClose} className="text-white/60">
            ×
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-white/60 text-xs mb-1 block">Total Calories</label>
            <input
              type="number"
              value={data.totalCalories || ""}
              onChange={(e) =>
                onChange({ ...data, totalCalories: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">Exercise</label>
            <input
              type="text"
              value={data.exercise || ""}
              onChange={(e) => onChange({ ...data, exercise: e.target.value })}
              placeholder="e.g., Running, Cycling"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-xs mb-1 block">Stand Hours</label>
              <input
                type="number"
                value={data.standHours || ""}
                onChange={(e) =>
                  onChange({ ...data, standHours: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Steps</label>
              <input
                type="number"
                value={data.steps || ""}
                onChange={(e) =>
                  onChange({ ...data, steps: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">Distance (miles)</label>
            <input
              type="number"
              step="0.1"
              value={data.distance || ""}
              onChange={(e) =>
                onChange({ ...data, distance: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DeficitCalculator;

