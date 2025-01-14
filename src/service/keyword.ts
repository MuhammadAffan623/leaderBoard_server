import { IKeyword, Keyword } from "../models/keyword";

const keywordService = () => {
  const createOrUpdateKeywords = async (
    newKeywords: string[]
  ): Promise<IKeyword> => {
    if (
      !Array.isArray(newKeywords) ||
      newKeywords.some((kw) => typeof kw !== "string")
    ) {
      throw new Error(
        "Invalid input: newKeywords must be an array of strings."
      );
    }

    // Check if a keywords document already exists
    let keywordDoc = await Keyword.findOne();

    if (keywordDoc) {
      // Merge new keywords with existing ones, ensuring uniqueness
      const updatedKeywords = Array.from(
        new Set([...keywordDoc.keywords, ...newKeywords])
      );
      keywordDoc.keywords = updatedKeywords;
      return await keywordDoc.save();
    } else {
      // Create a new document if none exists
      return await Keyword.create({ keywords: newKeywords });
    }
  };
  const getKewyords = async (): Promise<IKeyword[]> => {
    return await Keyword.find().lean();
  };
  return {
    createOrUpdateKeywords,
    getKewyords,
  };
};
