// Auto-generated from questions.csv
const questions = [
  {
    "id": "Q01",
    "title": "Which subject best describes your research data?",
    "type": "single",
    "required": true,
    "options": [
      "Chemistry / Crystallography",
      "Particle Physics",
      "Genomics",
      "Proteomics",
      "Structural Biology / Protein Structures",
      "Software / Code",
      "Other / General"
    ]
  },
  {
    "id": "Q02",
    "title": "Approximately how large is your dataset?",
    "type": "single",
    "required": true,
    "options": [
      "<100 MB",
      "100 MB–5 GB",
      "5–20 GB",
      "20–50 GB",
      "50–100 GB",
      "100–1000 GB",
      ">1000 GB",
      "I'm not sure"
    ]
  },
  {
    "id": "Q03",
    "title": "Approximately how large is your largest individual file?",
    "type": "single",
    "required": true,
    "options": [
      "<100 MB",
      "100 MB–1 GB",
      "1–5 GB",
      "5–20 GB",
      ">20 GB",
      "I'm not sure"
    ]
  },
  {
    "id": "Q04",
    "title": "What features do you need from the repository?",
    "type": "multi",
    "required": true,
    "options": [
      "DOI",
      "Embargo",
      "Private sharing",
      "Collaborator access",
      "API access"
    ],
    "subtitle": "Select all that apply."
  },
  {
    "id": "Q05",
    "title": "Does your research data include software or code?",
    "type": "single",
    "required": true,
    "options": [
      "No",
      "Yes, alongside other research data",
      "Yes, software/code is my primary research output",
      "I'm not sure"
    ]
  },
  {
    "id": "Q06",
    "title": "Do any of the following apply?",
    "type": "single",
    "required": false,
    "options": [
      "My funder requires a subject-specific repository.",
      "My journal requires a subject-specific repository.",
      "I don't have any specific requirements."
    ]
  },
  {
    "id": "Q07",
    "title": "Do you already have a preferred data licence for sharing your data?",
    "type": "single",
    "required": false,
    "options": [
      "CC0",
      "CC BY",
      "CC BY-NC",
      "No preference",
      "I'm not sure"
    ]
  }
];
