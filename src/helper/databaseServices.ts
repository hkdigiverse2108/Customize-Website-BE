// ================ All Find Services ================

const withLean = (options: any = {}) => ({
  ...options,
  lean: options?.lean ?? true,
});

const withReturnAfter = (options: any = {}) => ({
  ...withLean(options),
  returnDocument: options?.returnDocument || "after",
});

export const deleteSingleRecord = async (modelName, criteria, projection, options = {}) => {
  return modelName.deleteOne(criteria, projection, withLean(options));
};

export const getData = async (modelName, criteria, projection, options = {}) => {
  return modelName.find(criteria, projection, withLean(options));
};

export const getFirstMatch = async (modelName, criteria, projection, options = {}) => {
  return await modelName.findOne(criteria, projection, withLean(options));
};

export const getDataWithSorting = async (modelName, criteria, projection, options = {}) => {
  return await modelName.find(criteria, projection, withLean(options)).collation({ locale: "en" });
};

export const findOneAndPopulate = async (modelName, criteria, projection, options = {}, populateModel) => {
  return await modelName.findOne(criteria, projection, withLean(options)).populate(populateModel).exec();
};

export const findAllAndPopulate = async (modelName, criteria, projection, options = {}, populateModel) => {
  return await modelName.find(criteria, projection, withLean(options)).populate(populateModel);
};

export const findAllAndPopulateWithSorting = async (modelName, criteria, projection, options = {}, populateModel) => {
  return await modelName.find(criteria, projection, withLean(options)).collation({ locale: "en" }).populate(populateModel);
};

// ================ All Create Services ================

export const createOne = async (modelName, objToSave) => {
  return new modelName(objToSave).save();
};

export const createMany = async (modelName, objToSave) => {
  return modelName.insertMany(objToSave);
};

// ================ All Update Services ================

export const updateData = async (modelName, criteria, dataToSet, options = {}) => {
  return await modelName.findOneAndUpdate(criteria, dataToSet, withReturnAfter(options));
};

export const updateMany = async (modelName, criteria, dataToSet, options) => {
  return modelName.updateMany(criteria, dataToSet, options);
};

// ================ All Delete Services ================

export const deleteData = async (model, criteria, dataToSet, options = {}) => {
  return await model.findOneAndUpdate(criteria, { ...dataToSet, isDeleted: true }, withReturnAfter(options));
};

// ================ Count Data Services ================

export const countData = async (modelName, criteria) => {
  return modelName.countDocuments(criteria);
};

// ================ All Aggregate Services ================

export const aggregateData = async (modelName, criteria) => {
  return modelName.aggregate(criteria);
};

export const aggregateDataWithSorting = async (modelName, criteria) => {
  return modelName.aggregate(criteria).collation({ locale: "en" });
};

export const aggregateAndPopulate = async (modelName, criteria, populateModel) => {
  const result = await modelName.aggregate(criteria);
  return modelName.populate(result, populateModel);
};
