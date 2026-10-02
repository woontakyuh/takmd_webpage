// Source: public, non-draft entries in src/content/knowledge and src/content/media.
export type NoteBlock =
  | { readonly kind: 'heading' | 'paragraph'; readonly text: string }
  | { readonly kind: 'list'; readonly ordered: boolean; readonly items: readonly string[] };

export type OfficeNote = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly date: string;
  readonly tags: readonly string[];
  readonly url?: string;
  readonly mediaType?: string;
  readonly blocks: readonly NoteBlock[];
};

export const knowledgeNotes = [
  {
    "id": "ai-in-spine-surgery",
    "title": "AI Integration in Spine Surgery Practice",
    "description": "How artificial intelligence augments clinical decision-making, documentation, and outcome tracking in spine surgery.",
    "date": "2026-01-15",
    "tags": [
      "AI",
      "workflow",
      "clinical"
    ],
    "blocks": [
      {
        "kind": "heading",
        "text": "AI Integration in Spine Surgery"
      },
      {
        "kind": "paragraph",
        "text": "AI tools are increasingly being adopted in spine surgery — not to replace clinical judgment, but to augment documentation, streamline registry workflows, and support evidence-based decision-making."
      },
      {
        "kind": "heading",
        "text": "Current Applications"
      },
      {
        "kind": "list",
        "ordered": false,
        "items": [
          "Documentation assist — structured note generation from voice capture",
          "Registry automation — Notion-based patient databases with automated analytics",
          "Imaging analysis — deep learning for vertebral fracture detection",
          "Outcome tracking — automated PROM collection and trend visualization"
        ]
      },
      {
        "kind": "heading",
        "text": "Philosophy"
      },
      {
        "kind": "paragraph",
        "text": "The goal is cognitive augmentation: reducing administrative burden so surgeons can focus on what matters — the patient."
      }
    ]
  },
  {
    "id": "what-is-ube",
    "title": "What Is UBE? — Unilateral Biportal Endoscopy",
    "description": "An introduction to UBE technique, its advantages over conventional spine surgery, and current evidence.",
    "date": "2025-12-01",
    "tags": [
      "UBE",
      "MISS",
      "endoscopy"
    ],
    "blocks": [
      {
        "kind": "heading",
        "text": "What Is UBE?"
      },
      {
        "kind": "paragraph",
        "text": "Unilateral Biportal Endoscopy (UBE) is a minimally invasive spine surgical technique that uses two small portals — one for the endoscope and one for working instruments — to perform decompression, discectomy, and fusion procedures."
      },
      {
        "kind": "heading",
        "text": "Key Advantages"
      },
      {
        "kind": "list",
        "ordered": false,
        "items": [
          "Minimal tissue disruption — preserves paraspinal musculature",
          "Clear visualization — continuous saline irrigation provides excellent hemostasis",
          "Versatility — applicable to cervical, thoracic, and lumbar pathology",
          "Faster recovery — reduced postoperative pain and shorter hospital stay"
        ]
      },
      {
        "kind": "heading",
        "text": "Evidence Base"
      },
      {
        "kind": "paragraph",
        "text": "Multiple systematic reviews and meta-analyses have demonstrated comparable or superior outcomes to conventional open surgery for lumbar spinal stenosis and disc herniation."
      }
    ]
  },
  {
    "id": "surgical-outcome-metrics",
    "title": "Understanding Surgical Outcome Metrics",
    "description": "VAS, ODI, and other patient-reported outcome measures used to evaluate spine surgery effectiveness.",
    "date": "2025-10-20",
    "tags": [
      "outcomes",
      "PROM",
      "research"
    ],
    "blocks": [
      {
        "kind": "heading",
        "text": "Surgical Outcome Metrics"
      },
      {
        "kind": "paragraph",
        "text": "Patient-reported outcome measures (PROMs) are essential tools for evaluating surgical effectiveness and tracking recovery."
      },
      {
        "kind": "heading",
        "text": "Common Metrics"
      },
      {
        "kind": "list",
        "ordered": false,
        "items": [
          "VAS (Visual Analog Scale) — pain intensity, 0–10 scale",
          "ODI (Oswestry Disability Index) — functional disability assessment",
          "EQ-5D — health-related quality of life",
          "JOA Score — Japanese Orthopaedic Association score for myelopathy"
        ]
      },
      {
        "kind": "heading",
        "text": "Why PROMs Matter"
      },
      {
        "kind": "paragraph",
        "text": "Systematic PROM collection enables evidence-based practice improvement and contributes to large-scale outcome registries."
      }
    ]
  }
] as const satisfies readonly OfficeNote[];

export const mediaNotes = [
  {
    "id": "ube-decompression-technique",
    "title": "UBE Lumbar Decompression — Surgical Technique",
    "description": "Step-by-step overview of UBE decompression for lumbar spinal stenosis.",
    "date": "2025-11-10",
    "tags": [
      "UBE",
      "technique",
      "lumbar"
    ],
    "mediaType": "video",
    "url": "https://youtube.com",
    "blocks": [
      {
        "kind": "heading",
        "text": "UBE Lumbar Decompression"
      },
      {
        "kind": "paragraph",
        "text": "A detailed walkthrough of the UBE technique for lumbar spinal stenosis, demonstrating portal placement, endoscopic visualization, and ligamentum flavum resection."
      },
      {
        "kind": "heading",
        "text": "Key Steps"
      },
      {
        "kind": "list",
        "ordered": true,
        "items": [
          "Portal establishment under fluoroscopic guidance",
          "Working space creation with radiofrequency device",
          "Ipsilateral decompression",
          "Over-the-top contralateral decompression",
          "Confirmation of adequate neural element decompression"
        ]
      }
    ]
  },
  {
    "id": "cadaver-workshop-davos-2025",
    "title": "International UBE Cadaver Workshop — Davos Hospital 2025",
    "description": "Hands-on cadaver training for surgeons from 6 countries, covering basic to advanced UBE techniques.",
    "date": "2025-06-20",
    "tags": [
      "workshop",
      "education",
      "cadaver"
    ],
    "mediaType": "vlog",
    "blocks": [
      {
        "kind": "heading",
        "text": "International UBE Cadaver Workshop"
      },
      {
        "kind": "paragraph",
        "text": "Hosted at Davos Hospital's International Training Center. Participants from Pakistan, Vietnam, Thailand, Mongolia, Indonesia, and Korea practiced UBE techniques on cadaveric specimens under direct supervision."
      },
      {
        "kind": "heading",
        "text": "Program Highlights"
      },
      {
        "kind": "list",
        "ordered": false,
        "items": [
          "Lumbar decompression and discectomy",
          "Cervical posterior foraminotomy",
          "Advanced: UBE-assisted fusion techniques",
          "Live demonstration and one-on-one mentoring"
        ]
      }
    ]
  },
  {
    "id": "keynote-kosess-2024",
    "title": "KOSESS 2024 — Keynote: Future of Endoscopic Spine Surgery",
    "description": "Invited keynote on AI integration and standardization in endoscopic spine surgery education.",
    "date": "2024-11-15",
    "tags": [
      "talk",
      "KOSESS",
      "education"
    ],
    "mediaType": "talk",
    "blocks": [
      {
        "kind": "heading",
        "text": "KOSESS 2024 Keynote"
      },
      {
        "kind": "paragraph",
        "text": "Presented at the Korean Society of Endoscopic Spine Surgery annual meeting. Topics covered include the role of AI in surgical education, outcome tracking, and the path toward standardized endoscopic training curricula."
      }
    ]
  }
] as const satisfies readonly OfficeNote[];
