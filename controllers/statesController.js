const State = require('../model/State');
const fs = require('fs');

const path = require('path');


const getAllStates = async (req, res) => {
  try {
    const { contig } = req.query;
    const filePath = path.resolve(__dirname, '..', 'model', 'states.json');
    const statesData = await fs.promises.readFile(filePath, 'utf-8');
    const states = JSON.parse(statesData);

    // Retrieve the fun facts data from MongoDB
    const mongoStates = await State.find();

    // Merge the states data with the fun facts data
    const mergedStates = states.map(state => {
      const mongoState = mongoStates.find(mongoState => mongoState.stateCode === state.code);
      if (mongoState) {
        return {
          ...state,
          funfacts: mongoState.funfacts
        };
      } else {
        return state;
      }
    });

    // Filter states based on the "contig" query parameter
    if (contig === 'true') {
      // Contiguous states (Not AK or HI)
      const contiguousStates = mergedStates.filter(state => state.code !== 'AK' && state.code !== 'HI');
      res.json(contiguousStates);
    } else if (contig === 'false') {
      // Non-contiguous states (AK, HI)
      const nonContiguousStates = mergedStates.filter(state => state.code === 'AK' || state.code === 'HI');
      res.json(nonContiguousStates);
    } else {
      // Return all states if no filter is specified
      res.json(mergedStates);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const getContiguousStates = async (req, res) => {
  try {
    const contiguousStates = await State.find({ stateCode: { $nin: ['AK', 'HI'] } });
    res.json(contiguousStates);
    
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

const getStateData = async (req, res) => {
  const { state } = req.params;
  try {
    const filePath = path.resolve(__dirname, '..', 'model', 'states.json');
    const statesData = await fs.promises.readFile(filePath, 'utf-8');
    const states = JSON.parse(statesData);

    const stateDataFromJson = states.find(s => s.code === state);
    const stateDataFromMongo = await State.findOne({ stateCode: state });

    if (stateDataFromJson || stateDataFromMongo) {
      const mergedStateData = {
        ...stateDataFromJson,
        funfacts: stateDataFromMongo?.funfacts || []
      };
      res.json(mergedStateData);
    } else {
      res.status(404).json({ error: 'State not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const addState = async (req, res) => {
  try {
    const { stateCode, funfacts } = req.body;

    // Check if state with the same stateCode already exists in the collection
    const existingState = await State.findOne({ stateCode });

    if (existingState) {
      res.status(400).json({ error: 'State with the same stateCode already exists' });
    } else {
      // Create a new state document with stateCode and funfacts
      const newState = new State({
        stateCode,
        funfacts
      });

      // Save the new state document to the collection
      const savedState = await newState.save();

      res.status(201).json(savedState);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const getRandomFunFact = async (req, res) => {
  const { state } = req.params;
  try {
    const stateData = await State.findOne({ stateCode: state });
    if (stateData && stateData.funfacts.length > 0) {
      const randomIndex = Math.floor(Math.random() * stateData.funfacts.length);
      const randomFunFact = stateData.funfacts[randomIndex];
      res.json({ state: stateData.state, funfact: randomFunFact });
    } else {
      res.status(404).json({ error: 'No fun facts found for the state' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

const addFunFact = async (req, res) => {
  const { stateCode, funfacts } = req.body;
  try {
    let stateData = await State.findOne({ stateCode });

    if (stateData) {
      // State data with stateCode already exists
      stateData.funfacts.push(...funfacts);
    } else {
      // Create new state data with stateCode and fun facts
      stateData = new State({ stateCode, funfacts });
    }

    const updatedStateData = await stateData.save();
    res.json(updatedStateData);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}


const updateFunFact = async (req, res) => {
  const { state } = req.params;
  const { index, funfact } = req.body;
  try {
    const stateData = await State.findOne({ stateCode: state });
    if (stateData && stateData.funfacts.length > 0) {
      if (index > 0 && index <= stateData.funfacts.length) {
        stateData.funfacts[index - 1] = funfact;
        const updatedStateData = await stateData.save();
        res.json(updatedStateData);
      } else {
        res.status(400).json({ error: 'Invalid fun fact index' });
      }
    } else {
      res.status(404).json({ error: 'No fun facts found for the state' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

const deleteFunFact = async (req, res) => {
  const { state } = req.params;
  const { index } = req.body;
  try {
    const stateData = await State.findOne({ stateCode: state });
    if (stateData && stateData.funfacts.length > 0) {
      if (index > 0 && index <= stateData.funfacts.length) {
        stateData.funfacts.splice(index - 1, 1);
        const updatedStateData = await stateData.save();
        res.json(updatedStateData);
      } else {
        res.status(400).json({ error: 'Invalid fun fact index' });
      }
    } else {
      res.status(404).json({ error: 'No fun facts found for the state' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

const getCapital = async (req, res) => {
  const { state } = req.params;
  try {
    const filePath = path.resolve(__dirname, '..', 'model', 'states.json');
    const statesData = await fs.promises.readFile(filePath, 'utf-8');
    const states = JSON.parse(statesData);
    const stateData = states.find(stateObj => stateObj.code === state);
    if (stateData) {
      res.json({ state: stateData.state, capital: stateData.capital_city });
    } else {
      res.status(404).json({ error: 'State not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

const getNickname = async (req, res) => {
  const { state } = req.params;
  try {
    const filePath = path.resolve(__dirname, '..', 'model', 'states.json');
    const statesData = await fs.promises.readFile(filePath, 'utf-8');
    const states = JSON.parse(statesData);
    const stateData = states.find(stateObj => stateObj.code === state);
    if (stateData) {
      res.json({ state: stateData.state, nickname: stateData.nickname });
    } else {
      res.status(404).json({ error: 'State not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

const getPopulation = async (req, res) => {
  const { state } = req.params;
  try {
    const filePath = path.resolve(__dirname, '..', 'model', 'states.json');
    const statesData = await fs.promises.readFile(filePath, 'utf-8');
    const states = JSON.parse(statesData);
    const stateData = states.find(stateObj => stateObj.code === state);
    if (stateData) {
      res.json({ state: stateData.state, population: stateData.population });
    } else {
      res.status(404).json({ error: 'State not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

const getAdmission = async (req, res) => {
  const { state } = req.params;
  try {
    const filePath = path.resolve(__dirname, '..', 'model', 'states.json');
    const statesData = await fs.promises.readFile(filePath, 'utf-8');
    const states = JSON.parse(statesData);
    const stateData = states.find(stateObj => stateObj.code === state);
    if (stateData) {
      res.json({ state: stateData.state, admitted: stateData.admission_date });
    } else {
      res.status(404).json({ error: 'State not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getAllStates,
  getContiguousStates,
  getStateData,
  addState,
  getRandomFunFact,
  addFunFact,
  updateFunFact,
  deleteFunFact,
  getCapital,
  getNickname,
  getPopulation,
  getAdmission
}