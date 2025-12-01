const Patient=require('../model/relationalModels/patient');

// Simple ID generators
const generateRegId = async () => {
  const lastPatient = await Patient.findOne({
    order: [['id', 'DESC']]
  });
  
  const nextNumber = lastPatient ? lastPatient.id + 1 : 1;
  return `REG${nextNumber.toString().padStart(6, '0')}`;  // REG000001, REG000002, etc.
};

const generateVisitId = async (reg_id) => {
  const visitCount = await Visit.count({ where: { reg_id } });
  const nextVisit = visitCount + 1;
  
  return `V${nextVisit.toString().padStart(4, '0')}`;  // V0001, V0002, etc.
};

module.exports = { generateRegId, generateVisitId };