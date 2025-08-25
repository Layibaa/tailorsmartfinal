const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Dummy prediction rules
function dummyPredict({ age, height, weight, gender }) {
  if (gender === "male") {
    return {
      chest: height * 0.45,
      waist: weight * 0.4,
      hip: height * 0.42,
      shoulder: height * 0.25,
      sleeveLength: height * 0.23,
    };
  } else {
    return {
      chest: height * 0.42,
      waist: weight * 0.35,
      hip: height * 0.45,
      shoulder: height * 0.24,
      sleeveLength: height * 0.22,
    };
  }
}

// Simple KNN (average of closest users)
function knnPredict(user, dataset, k = 3) {
  const distances = dataset.map(u => {
    const dist = Math.sqrt(
      Math.pow(user.age - (u.age || 0), 2) +
      Math.pow(user.height - (u.height || 0), 2) +
      Math.pow(user.weight - (u.weight || 0), 2)
    );
    return { dist, m: u.customerProfile.savedMeasurements };
  });

  distances.sort((a, b) => a.dist - b.dist);
  const neighbors = distances.slice(0, k).map(n => n.m);

  const avg = (key) =>
    neighbors.reduce((sum, n) => sum + (n?.[key] || 0), 0) / neighbors.length;

  return {
    chest: avg("chest"),
    waist: avg("waist"),
    hip: avg("hip"),
    shoulder: avg("shoulder"),
    sleeveLength: avg("sleeveLength"),
  };
}

router.post("/", async (req, res) => {
  const { age, height, weight, gender } = req.body;

  try {
    // Find users who have savedMeasurements
    const allUsers = await User.find({
      "customerProfile.savedMeasurements": { $exists: true }
    });

    let prediction;
    if (allUsers.length < 10) {
      prediction = dummyPredict({ age, height, weight, gender });
    } else {
      prediction = knnPredict({ age, height, weight }, allUsers);
    }

    res.json(prediction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
