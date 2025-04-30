// In your commune-data.js or a new address-data.js:
export const addressRelationships = {
    communes: {
      "គគី": { district: "កៀនស្វាយ", province: "កណ្តាល" },
      "កាស": { district: "កាស", province: "ព្រៃវែង" },
      "ក្អែក": { district: "ក្អែក", province: "ភ្នំពេញ" }
    },
    districts: {
      "កៀនស្វាយ": ["គគីរ"],
      "ក្អែក": ["ក្អែក"],
      "កាស": ["កាស"]
    },
    provinces: {
      "ព្រៃវែង": ["កៀនស្វាយ"],
      "កណ្តាល": ["កាស"],
      "ភ្នំពេញ": ["ក្អែក"]
    }
  };



