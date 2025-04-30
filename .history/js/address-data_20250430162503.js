export const addressRelationships = {
    commune: [
      "បន្ទាយនាង", "បត់ត្រង់", "ចំណោម", "គោកបល្ល័ង្គ", "គយម៉ែង", 
      "អូរប្រាសាទ", "ភ្នំតូច", "រហាត់ទឹក", "ឫស្សីក្រោក", "សំបួរ", 
      "ឃុំសឿ", "ឃុំស្រះរាំង", "ឃុំតាឡំ"
    ],
    districts: {
      "មង្គលបុរី": [
        "បន្ទាយនាង", "បត់ត្រង់", "ចំណោម", "គោកបល្ល័ង្គ", "គយម៉ែង", 
        "អូរប្រាសាទ", "ភ្នំតូច", "រហាត់ទឹក", "ឫស្សីក្រោក", "សំបួរ", 
        "សឿ", "ស្រះរាំង", "តាឡំ"
      ]
    },
    provinces: {
      "បន្ទាយមានជ័យ": ["មង្គលបុរី"]
    },
    getAddressDetails: (commune) => {
      const district = "មង្គលបុរី"; // All communes belong to this district
      const province = "បន្ទាយមានជ័យ"; // All communes belong to this province
      return { district, province };
    }
  };
  