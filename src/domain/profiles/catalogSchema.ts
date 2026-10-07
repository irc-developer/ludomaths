/** Closed v2 contract; contains no catalog data. */
export const catalogSchema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "LudoMaths profile catalog v2",
  "type": "object",
  "properties": {
    "format": {
      "enum": [
        "ludomaths-profile-catalog"
      ]
    },
    "schemaVersion": {
      "enum": [
        "2.0.0"
      ]
    },
    "catalogId": {
      "$ref": "#/$defs/lmId"
    },
    "catalogVersion": {
      "type": "string",
      "pattern": "^[a-z0-9-]{1,40}$"
    },
    "generatedAt": {
      "type": "string",
      "format": "date-time"
    },
    "payloadSha256": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$"
    },
    "edition": {
      "enum": [
        "11"
      ]
    },
    "capabilityReviewVersion": {
      "enum": [
        "lm-pilot-1"
      ]
    },
    "scope": {
      "$ref": "#/$defs/scope"
    },
    "factions": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/faction"
      },
      "maxItems": 5000
    },
    "units": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/unit"
      },
      "maxItems": 5000
    },
    "miniatures": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/miniature"
      },
      "maxItems": 5000
    },
    "weapons": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/weapon"
      },
      "maxItems": 5000
    },
    "weaponModes": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/weaponMode"
      },
      "maxItems": 5000
    },
    "keywords": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/keyword"
      },
      "maxItems": 5000
    },
    "compositions": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/composition"
      },
      "maxItems": 5000
    },
    "equipmentChoices": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/equipmentChoice"
      },
      "maxItems": 5000
    },
    "rules": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/rule"
      },
      "maxItems": 5000
    },
    "relations": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/relation"
      },
      "maxItems": 5000
    },
    "issues": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/issue"
      },
      "maxItems": 5000
    },
    "coverage": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/coverage"
      },
      "maxItems": 5000
    }
  },
  "required": [
    "format",
    "schemaVersion",
    "catalogId",
    "catalogVersion",
    "generatedAt",
    "payloadSha256",
    "edition",
    "capabilityReviewVersion",
    "scope",
    "factions",
    "units",
    "miniatures",
    "weapons",
    "weaponModes",
    "keywords",
    "compositions",
    "equipmentChoices",
    "rules",
    "relations",
    "issues",
    "coverage"
  ],
  "additionalProperties": false,
  "$defs": {
    "lmId": {
      "type": "string",
      "pattern": "^lm_[a-f0-9]{24}$"
    },
    "fId": {
      "type": "string",
      "pattern": "^f_[a-f0-9]{24}$"
    },
    "uId": {
      "type": "string",
      "pattern": "^u_[a-f0-9]{24}$"
    },
    "mId": {
      "type": "string",
      "pattern": "^m_[a-f0-9]{24}$"
    },
    "wId": {
      "type": "string",
      "pattern": "^w_[a-f0-9]{24}$"
    },
    "wmId": {
      "type": "string",
      "pattern": "^wm_[a-f0-9]{24}$"
    },
    "kId": {
      "type": "string",
      "pattern": "^k_[a-f0-9]{24}$"
    },
    "cId": {
      "type": "string",
      "pattern": "^c_[a-f0-9]{24}$"
    },
    "eqId": {
      "type": "string",
      "pattern": "^eq_[a-f0-9]{24}$"
    },
    "rId": {
      "type": "string",
      "pattern": "^r_[a-f0-9]{24}$"
    },
    "relId": {
      "type": "string",
      "pattern": "^rel_[a-f0-9]{24}$"
    },
    "svId": {
      "type": "string",
      "pattern": "^sv_[a-f0-9]{24}$"
    },
    "entityId": {
      "anyOf": [
        {
          "$ref": "#/$defs/fId"
        },
        {
          "$ref": "#/$defs/uId"
        },
        {
          "$ref": "#/$defs/mId"
        },
        {
          "$ref": "#/$defs/wId"
        },
        {
          "$ref": "#/$defs/wmId"
        },
        {
          "$ref": "#/$defs/kId"
        },
        {
          "$ref": "#/$defs/cId"
        },
        {
          "$ref": "#/$defs/eqId"
        },
        {
          "$ref": "#/$defs/rId"
        },
        {
          "$ref": "#/$defs/relId"
        },
        {
          "$ref": "#/$defs/svId"
        }
      ]
    },
    "value": {
      "type": "object",
      "properties": {
        "raw": {
          "anyOf": [
            {
              "type": "null"
            },
            {
              "type": "integer"
            },
            {
              "type": "string",
              "maxLength": 32
            }
          ]
        },
        "normalized": {
          "anyOf": [
            {
              "type": "null"
            },
            {
              "type": "integer",
              "minimum": 0,
              "maximum": 10000
            },
            {
              "type": "object",
              "properties": {
                "kind": {
                  "enum": [
                    "fixed"
                  ]
                },
                "value": {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 10000
                }
              },
              "required": [
                "kind",
                "value"
              ],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {
                "kind": {
                  "enum": [
                    "dice"
                  ]
                },
                "count": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 10000
                },
                "sides": {
                  "enum": [
                    3,
                    6
                  ]
                },
                "modifier": {
                  "type": "integer",
                  "minimum": -100,
                  "maximum": 100
                }
              },
              "required": [
                "kind",
                "count",
                "sides",
                "modifier"
              ],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {
                "kind": {
                  "enum": [
                    "inches"
                  ]
                },
                "value": {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 10000
                }
              },
              "required": [
                "kind",
                "value"
              ],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {
                "kind": {
                  "enum": [
                    "melee"
                  ]
                }
              },
              "required": [
                "kind"
              ],
              "additionalProperties": false
            }
          ]
        },
        "status": {
          "enum": [
            "parsed",
            "missing",
            "not-applicable",
            "ambiguous",
            "unsupported"
          ]
        }
      },
      "required": [
        "raw",
        "normalized",
        "status"
      ],
      "additionalProperties": false
    },
    "scope": {
      "type": "object",
      "properties": {
        "factionIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/fId"
          },
          "maxItems": 5000
        },
        "profile": {
          "enum": [
            "standard"
          ]
        },
        "eligibility": {
          "enum": [
            "direct"
          ]
        },
        "coverage": {
          "enum": [
            "pilot",
            "selected",
            "full-faction"
          ]
        },
        "selectedUnitIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/uId"
          },
          "maxItems": 5000
        }
      },
      "required": [
        "factionIds",
        "profile",
        "eligibility",
        "coverage",
        "selectedUnitIds"
      ],
      "additionalProperties": false
    },
    "faction": {
      "type": "object",
      "properties": {
        "id": {
          "$ref": "#/$defs/fId"
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 150
        },
        "parentId": {
          "anyOf": [
            {
              "$ref": "#/$defs/fId"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "id",
        "name",
        "parentId"
      ],
      "additionalProperties": false
    },
    "unit": {
      "type": "object",
      "properties": {
        "id": {
          "$ref": "#/$defs/uId"
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 150
        },
        "factionIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/fId"
          },
          "maxItems": 5000
        },
        "miniatureIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/mId"
          },
          "maxItems": 5000
        },
        "compositionIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/cId"
          },
          "maxItems": 5000
        },
        "equipmentChoiceIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/eqId"
          },
          "maxItems": 5000
        },
        "ruleIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/rId"
          },
          "maxItems": 5000
        }
      },
      "required": [
        "id",
        "name",
        "factionIds",
        "miniatureIds",
        "compositionIds",
        "equipmentChoiceIds",
        "ruleIds"
      ],
      "additionalProperties": false
    },
    "invulnerable": {
      "type": "object",
      "properties": {
        "id": {
          "$ref": "#/$defs/svId"
        },
        "scope": {
          "enum": [
            "unit",
            "miniature"
          ]
        },
        "miniatureId": {
          "anyOf": [
            {
              "$ref": "#/$defs/mId"
            },
            {
              "type": "null"
            }
          ]
        },
        "save": {
          "$ref": "#/$defs/value"
        },
        "rangedSave": {
          "$ref": "#/$defs/value"
        },
        "meleeSave": {
          "$ref": "#/$defs/value"
        },
        "conditionRuleIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/rId"
          },
          "maxItems": 5000
        }
      },
      "required": [
        "id",
        "scope",
        "miniatureId",
        "save",
        "rangedSave",
        "meleeSave",
        "conditionRuleIds"
      ],
      "additionalProperties": false
    },
    "miniature": {
      "type": "object",
      "properties": {
        "id": {
          "$ref": "#/$defs/mId"
        },
        "unitId": {
          "$ref": "#/$defs/uId"
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 150
        },
        "characteristics": {
          "type": "object",
          "properties": {
            "toughness": {
              "$ref": "#/$defs/value"
            },
            "save": {
              "$ref": "#/$defs/value"
            },
            "woundsMax": {
              "$ref": "#/$defs/value"
            }
          },
          "required": [
            "toughness",
            "save",
            "woundsMax"
          ],
          "additionalProperties": false
        },
        "keywordIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/kId"
          },
          "maxItems": 5000
        },
        "invulnerableSaves": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/invulnerable"
          },
          "maxItems": 5000
        },
        "ruleIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/rId"
          },
          "maxItems": 5000
        }
      },
      "required": [
        "id",
        "unitId",
        "name",
        "characteristics",
        "keywordIds",
        "invulnerableSaves",
        "ruleIds"
      ],
      "additionalProperties": false
    },
    "weapon": {
      "type": "object",
      "properties": {
        "id": {
          "$ref": "#/$defs/wId"
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 150
        },
        "modeIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/wmId"
          },
          "maxItems": 5000
        },
        "ruleIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/rId"
          },
          "maxItems": 5000
        }
      },
      "required": [
        "id",
        "name",
        "modeIds",
        "ruleIds"
      ],
      "additionalProperties": false
    },
    "targetCondition": {
      "type": "object",
      "properties": {
        "state": {
          "enum": [
            "not-applicable",
            "reviewed",
            "pending"
          ]
        },
        "match": {
          "enum": [
            "any",
            "none",
            null
          ]
        },
        "keywordIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/kId"
          },
          "maxItems": 5000
        },
        "ruleIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/rId"
          },
          "maxItems": 5000
        }
      },
      "required": [
        "state",
        "match",
        "keywordIds",
        "ruleIds"
      ],
      "additionalProperties": false
    },
    "weaponMode": {
      "type": "object",
      "properties": {
        "id": {
          "$ref": "#/$defs/wmId"
        },
        "weaponId": {
          "$ref": "#/$defs/wId"
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 150
        },
        "type": {
          "enum": [
            "ranged",
            "melee"
          ]
        },
        "range": {
          "$ref": "#/$defs/value"
        },
        "characteristics": {
          "type": "object",
          "properties": {
            "attacks": {
              "$ref": "#/$defs/value"
            },
            "ballisticSkill": {
              "$ref": "#/$defs/value"
            },
            "weaponSkill": {
              "$ref": "#/$defs/value"
            },
            "strength": {
              "$ref": "#/$defs/value"
            },
            "armourPenetration": {
              "$ref": "#/$defs/value"
            },
            "damage": {
              "$ref": "#/$defs/value"
            }
          },
          "required": [
            "attacks",
            "ballisticSkill",
            "weaponSkill",
            "strength",
            "armourPenetration",
            "damage"
          ],
          "additionalProperties": false
        },
        "targetCondition": {
          "$ref": "#/$defs/targetCondition"
        },
        "ruleIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/rId"
          },
          "maxItems": 5000
        }
      },
      "required": [
        "id",
        "weaponId",
        "name",
        "type",
        "range",
        "characteristics",
        "targetCondition",
        "ruleIds"
      ],
      "additionalProperties": false
    },
    "keyword": {
      "type": "object",
      "properties": {
        "id": {
          "$ref": "#/$defs/kId"
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 150
        }
      },
      "required": [
        "id",
        "name"
      ],
      "additionalProperties": false
    },
    "composition": {
      "type": "object",
      "properties": {
        "id": {
          "$ref": "#/$defs/cId"
        },
        "unitId": {
          "$ref": "#/$defs/uId"
        },
        "isDefault": {
          "type": "boolean"
        },
        "members": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "miniatureId": {
                "$ref": "#/$defs/mId"
              },
              "min": {
                "type": "integer",
                "minimum": 0,
                "maximum": 10000
              },
              "max": {
                "type": "integer",
                "minimum": 0,
                "maximum": 10000
              }
            },
            "required": [
              "miniatureId",
              "min",
              "max"
            ],
            "additionalProperties": false
          },
          "maxItems": 5000
        },
        "conditionRuleIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/rId"
          },
          "maxItems": 5000
        }
      },
      "required": [
        "id",
        "unitId",
        "isDefault",
        "members",
        "conditionRuleIds"
      ],
      "additionalProperties": false
    },
    "equipmentChoice": {
      "type": "object",
      "properties": {
        "id": {
          "$ref": "#/$defs/eqId"
        },
        "unitId": {
          "$ref": "#/$defs/uId"
        },
        "miniatureId": {
          "$ref": "#/$defs/mId"
        },
        "kind": {
          "enum": [
            "default",
            "loadout",
            "limited"
          ]
        },
        "weaponIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/wId"
          },
          "maxItems": 5000
        },
        "min": {
          "type": "integer",
          "minimum": 0,
          "maximum": 10000
        },
        "max": {
          "type": "integer",
          "minimum": 0,
          "maximum": 10000
        },
        "allowDuplicates": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "null"
            }
          ]
        },
        "conditionRuleIds": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/rId"
          },
          "maxItems": 5000
        }
      },
      "required": [
        "id",
        "unitId",
        "miniatureId",
        "kind",
        "weaponIds",
        "min",
        "max",
        "allowDuplicates",
        "conditionRuleIds"
      ],
      "additionalProperties": false
    },
    "rule": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/rId"
            },
            "name": {
              "type": "string",
              "minLength": 1,
              "maxLength": 150
            },
            "description": {
              "type": "string",
              "maxLength": 1500
            },
            "requiredContext": {
              "type": "array",
              "items": {
                "enum": [
                  "distance",
                  "weaponRange",
                  "phase",
                  "unengaged",
                  "setUpThisTurn",
                  "maxModelMovement",
                  "targetKeywords",
                  "targetUnitModelCount",
                  "lethalChoice",
                  "riledUp",
                  "attackType",
                  "attackerWithinObjective",
                  "targetWithinObjective"
                ]
              },
              "maxItems": 5000
            },
            "reviewState": {
              "enum": [
                "reviewed"
              ]
            },
            "capabilityId": {
              "enum": [
                "torrent"
              ]
            },
            "parameters": {
              "type": "object",
              "properties": {},
              "required": [],
              "additionalProperties": false
            },
            "reviewVersion": {
              "enum": [
                "1.0.0"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "description",
            "requiredContext",
            "reviewState",
            "capabilityId",
            "parameters",
            "reviewVersion"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/rId"
            },
            "name": {
              "type": "string",
              "minLength": 1,
              "maxLength": 150
            },
            "description": {
              "type": "string",
              "maxLength": 1500
            },
            "requiredContext": {
              "type": "array",
              "items": {
                "enum": [
                  "distance",
                  "weaponRange",
                  "phase",
                  "unengaged",
                  "setUpThisTurn",
                  "maxModelMovement",
                  "targetKeywords",
                  "targetUnitModelCount",
                  "lethalChoice",
                  "riledUp",
                  "attackType",
                  "attackerWithinObjective",
                  "targetWithinObjective"
                ]
              },
              "maxItems": 5000
            },
            "reviewState": {
              "enum": [
                "reviewed"
              ]
            },
            "capabilityId": {
              "enum": [
                "heavy"
              ]
            },
            "parameters": {
              "type": "object",
              "properties": {},
              "required": [],
              "additionalProperties": false
            },
            "reviewVersion": {
              "enum": [
                "1.0.0"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "description",
            "requiredContext",
            "reviewState",
            "capabilityId",
            "parameters",
            "reviewVersion"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/rId"
            },
            "name": {
              "type": "string",
              "minLength": 1,
              "maxLength": 150
            },
            "description": {
              "type": "string",
              "maxLength": 1500
            },
            "requiredContext": {
              "type": "array",
              "items": {
                "enum": [
                  "distance",
                  "weaponRange",
                  "phase",
                  "unengaged",
                  "setUpThisTurn",
                  "maxModelMovement",
                  "targetKeywords",
                  "targetUnitModelCount",
                  "lethalChoice",
                  "riledUp",
                  "attackType",
                  "attackerWithinObjective",
                  "targetWithinObjective"
                ]
              },
              "maxItems": 5000
            },
            "reviewState": {
              "enum": [
                "reviewed"
              ]
            },
            "capabilityId": {
              "enum": [
                "devastatingWounds"
              ]
            },
            "parameters": {
              "type": "object",
              "properties": {},
              "required": [],
              "additionalProperties": false
            },
            "reviewVersion": {
              "enum": [
                "1.0.0"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "description",
            "requiredContext",
            "reviewState",
            "capabilityId",
            "parameters",
            "reviewVersion"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/rId"
            },
            "name": {
              "type": "string",
              "minLength": 1,
              "maxLength": 150
            },
            "description": {
              "type": "string",
              "maxLength": 1500
            },
            "requiredContext": {
              "type": "array",
              "items": {
                "enum": [
                  "distance",
                  "weaponRange",
                  "phase",
                  "unengaged",
                  "setUpThisTurn",
                  "maxModelMovement",
                  "targetKeywords",
                  "targetUnitModelCount",
                  "lethalChoice",
                  "riledUp",
                  "attackType",
                  "attackerWithinObjective",
                  "targetWithinObjective"
                ]
              },
              "maxItems": 5000
            },
            "reviewState": {
              "enum": [
                "reviewed"
              ]
            },
            "capabilityId": {
              "enum": [
                "rapidFire"
              ]
            },
            "parameters": {
              "type": "object",
              "properties": {
                "additionalAttacks": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 10000
                }
              },
              "required": [
                "additionalAttacks"
              ],
              "additionalProperties": false
            },
            "reviewVersion": {
              "enum": [
                "1.0.0"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "description",
            "requiredContext",
            "reviewState",
            "capabilityId",
            "parameters",
            "reviewVersion"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/rId"
            },
            "name": {
              "type": "string",
              "minLength": 1,
              "maxLength": 150
            },
            "description": {
              "type": "string",
              "maxLength": 1500
            },
            "requiredContext": {
              "type": "array",
              "items": {
                "enum": [
                  "distance",
                  "weaponRange",
                  "phase",
                  "unengaged",
                  "setUpThisTurn",
                  "maxModelMovement",
                  "targetKeywords",
                  "targetUnitModelCount",
                  "lethalChoice",
                  "riledUp",
                  "attackType",
                  "attackerWithinObjective",
                  "targetWithinObjective"
                ]
              },
              "maxItems": 5000
            },
            "reviewState": {
              "enum": [
                "reviewed"
              ]
            },
            "capabilityId": {
              "enum": [
                "anti"
              ]
            },
            "parameters": {
              "type": "object",
              "properties": {
                "threshold": {
                  "type": "integer",
                  "minimum": 2,
                  "maximum": 6
                },
                "targetKinds": {
                  "type": "array",
                  "items": {
                    "enum": [
                      "monster",
                      "vehicle"
                    ]
                  },
                  "maxItems": 5000
                }
              },
              "required": [
                "threshold",
                "targetKinds"
              ],
              "additionalProperties": false
            },
            "reviewVersion": {
              "enum": [
                "1.0.0"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "description",
            "requiredContext",
            "reviewState",
            "capabilityId",
            "parameters",
            "reviewVersion"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/rId"
            },
            "name": {
              "type": "string",
              "minLength": 1,
              "maxLength": 150
            },
            "description": {
              "type": "string",
              "maxLength": 1500
            },
            "requiredContext": {
              "type": "array",
              "items": {
                "enum": [
                  "distance",
                  "weaponRange",
                  "phase",
                  "unengaged",
                  "setUpThisTurn",
                  "maxModelMovement",
                  "targetKeywords",
                  "targetUnitModelCount",
                  "lethalChoice",
                  "riledUp",
                  "attackType",
                  "attackerWithinObjective",
                  "targetWithinObjective"
                ]
              },
              "maxItems": 5000
            },
            "reviewState": {
              "enum": [
                "reviewed"
              ]
            },
            "capabilityId": {
              "enum": [
                "blast"
              ]
            },
            "parameters": {
              "type": "object",
              "properties": {
                "additionalAttacksPerFive": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 10000
                }
              },
              "required": [
                "additionalAttacksPerFive"
              ],
              "additionalProperties": false
            },
            "reviewVersion": {
              "enum": [
                "1.0.0"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "description",
            "requiredContext",
            "reviewState",
            "capabilityId",
            "parameters",
            "reviewVersion"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/rId"
            },
            "name": {
              "type": "string",
              "minLength": 1,
              "maxLength": 150
            },
            "description": {
              "type": "string",
              "maxLength": 1500
            },
            "requiredContext": {
              "type": "array",
              "items": {
                "enum": [
                  "distance",
                  "weaponRange",
                  "phase",
                  "unengaged",
                  "setUpThisTurn",
                  "maxModelMovement",
                  "targetKeywords",
                  "targetUnitModelCount",
                  "lethalChoice",
                  "riledUp",
                  "attackType",
                  "attackerWithinObjective",
                  "targetWithinObjective"
                ]
              },
              "maxItems": 5000
            },
            "reviewState": {
              "enum": [
                "reviewed"
              ]
            },
            "capabilityId": {
              "enum": [
                "hitBonus"
              ]
            },
            "parameters": {
              "type": "object",
              "properties": {
                "modifier": {
                  "type": "integer",
                  "minimum": -1,
                  "maximum": 1
                }
              },
              "required": [
                "modifier"
              ],
              "additionalProperties": false
            },
            "reviewVersion": {
              "enum": [
                "1.0.0"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "description",
            "requiredContext",
            "reviewState",
            "capabilityId",
            "parameters",
            "reviewVersion"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/rId"
            },
            "name": {
              "type": "string",
              "minLength": 1,
              "maxLength": 150
            },
            "description": {
              "type": "string",
              "maxLength": 1500
            },
            "requiredContext": {
              "type": "array",
              "items": {
                "enum": [
                  "distance",
                  "weaponRange",
                  "phase",
                  "unengaged",
                  "setUpThisTurn",
                  "maxModelMovement",
                  "targetKeywords",
                  "targetUnitModelCount",
                  "lethalChoice",
                  "riledUp",
                  "attackType",
                  "attackerWithinObjective",
                  "targetWithinObjective"
                ]
              },
              "maxItems": 5000
            },
            "reviewState": {
              "enum": [
                "reviewed"
              ]
            },
            "capabilityId": {
              "enum": [
                "riledUp"
              ]
            },
            "parameters": {
              "type": "object",
              "properties": {
                "invulnerableSave": {
                  "type": "integer",
                  "minimum": 2,
                  "maximum": 6
                }
              },
              "required": [
                "invulnerableSave"
              ],
              "additionalProperties": false
            },
            "reviewVersion": {
              "enum": [
                "1.0.0"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "description",
            "requiredContext",
            "reviewState",
            "capabilityId",
            "parameters",
            "reviewVersion"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/rId"
            },
            "name": {
              "type": "string",
              "minLength": 1,
              "maxLength": 150
            },
            "description": {
              "type": "string",
              "maxLength": 1500
            },
            "requiredContext": {
              "type": "array",
              "items": {
                "enum": [
                  "distance",
                  "weaponRange",
                  "phase",
                  "unengaged",
                  "setUpThisTurn",
                  "maxModelMovement",
                  "targetKeywords",
                  "targetUnitModelCount",
                  "lethalChoice",
                  "riledUp",
                  "attackType",
                  "attackerWithinObjective",
                  "targetWithinObjective"
                ]
              },
              "maxItems": 5000
            },
            "reviewState": {
              "enum": [
                "pending"
              ]
            },
            "capabilityId": {
              "enum": [
                null
              ]
            },
            "parameters": {
              "type": "object",
              "properties": {},
              "required": [],
              "additionalProperties": false
            },
            "reviewVersion": {
              "enum": [
                null
              ]
            }
          },
          "required": [
            "id",
            "name",
            "description",
            "requiredContext",
            "reviewState",
            "capabilityId",
            "parameters",
            "reviewVersion"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/rId"
            },
            "name": {
              "type": "string",
              "minLength": 1,
              "maxLength": 150
            },
            "description": {
              "type": "string",
              "maxLength": 1500
            },
            "requiredContext": {
              "type": "array",
              "items": {
                "enum": [
                  "distance",
                  "weaponRange",
                  "phase",
                  "unengaged",
                  "setUpThisTurn",
                  "maxModelMovement",
                  "targetKeywords",
                  "targetUnitModelCount",
                  "lethalChoice",
                  "riledUp",
                  "attackType",
                  "attackerWithinObjective",
                  "targetWithinObjective"
                ]
              },
              "maxItems": 5000
            },
            "reviewState": {
              "enum": [
                "out-of-scope"
              ]
            },
            "capabilityId": {
              "enum": [
                null
              ]
            },
            "parameters": {
              "type": "object",
              "properties": {},
              "required": [],
              "additionalProperties": false
            },
            "reviewVersion": {
              "enum": [
                "1.0.0"
              ]
            }
          },
          "required": [
            "id",
            "name",
            "description",
            "requiredContext",
            "reviewState",
            "capabilityId",
            "parameters",
            "reviewVersion"
          ],
          "additionalProperties": false
        }
      ]
    },
    "relation": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/relId"
            },
            "kind": {
              "enum": [
                "unit-miniature"
              ]
            },
            "fromId": {
              "$ref": "#/$defs/uId"
            },
            "toId": {
              "$ref": "#/$defs/mId"
            },
            "quantity": {
              "anyOf": [
                {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 10000
                },
                {
                  "type": "null"
                }
              ]
            },
            "conditionRuleIds": {
              "type": "array",
              "items": {
                "$ref": "#/$defs/rId"
              },
              "maxItems": 5000
            }
          },
          "required": [
            "id",
            "kind",
            "fromId",
            "toId",
            "quantity",
            "conditionRuleIds"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/relId"
            },
            "kind": {
              "enum": [
                "miniature-keyword"
              ]
            },
            "fromId": {
              "$ref": "#/$defs/mId"
            },
            "toId": {
              "$ref": "#/$defs/kId"
            },
            "quantity": {
              "anyOf": [
                {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 10000
                },
                {
                  "type": "null"
                }
              ]
            },
            "conditionRuleIds": {
              "type": "array",
              "items": {
                "$ref": "#/$defs/rId"
              },
              "maxItems": 5000
            }
          },
          "required": [
            "id",
            "kind",
            "fromId",
            "toId",
            "quantity",
            "conditionRuleIds"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/relId"
            },
            "kind": {
              "enum": [
                "weapon-mode"
              ]
            },
            "fromId": {
              "$ref": "#/$defs/wId"
            },
            "toId": {
              "$ref": "#/$defs/wmId"
            },
            "quantity": {
              "anyOf": [
                {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 10000
                },
                {
                  "type": "null"
                }
              ]
            },
            "conditionRuleIds": {
              "type": "array",
              "items": {
                "$ref": "#/$defs/rId"
              },
              "maxItems": 5000
            }
          },
          "required": [
            "id",
            "kind",
            "fromId",
            "toId",
            "quantity",
            "conditionRuleIds"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/relId"
            },
            "kind": {
              "enum": [
                "mode-rule"
              ]
            },
            "fromId": {
              "$ref": "#/$defs/wmId"
            },
            "toId": {
              "$ref": "#/$defs/rId"
            },
            "quantity": {
              "anyOf": [
                {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 10000
                },
                {
                  "type": "null"
                }
              ]
            },
            "conditionRuleIds": {
              "type": "array",
              "items": {
                "$ref": "#/$defs/rId"
              },
              "maxItems": 5000
            }
          },
          "required": [
            "id",
            "kind",
            "fromId",
            "toId",
            "quantity",
            "conditionRuleIds"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/relId"
            },
            "kind": {
              "enum": [
                "unit-rule"
              ]
            },
            "fromId": {
              "$ref": "#/$defs/uId"
            },
            "toId": {
              "$ref": "#/$defs/rId"
            },
            "quantity": {
              "anyOf": [
                {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 10000
                },
                {
                  "type": "null"
                }
              ]
            },
            "conditionRuleIds": {
              "type": "array",
              "items": {
                "$ref": "#/$defs/rId"
              },
              "maxItems": 5000
            }
          },
          "required": [
            "id",
            "kind",
            "fromId",
            "toId",
            "quantity",
            "conditionRuleIds"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/relId"
            },
            "kind": {
              "enum": [
                "choice-weapon"
              ]
            },
            "fromId": {
              "$ref": "#/$defs/eqId"
            },
            "toId": {
              "$ref": "#/$defs/wId"
            },
            "quantity": {
              "anyOf": [
                {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 10000
                },
                {
                  "type": "null"
                }
              ]
            },
            "conditionRuleIds": {
              "type": "array",
              "items": {
                "$ref": "#/$defs/rId"
              },
              "maxItems": 5000
            }
          },
          "required": [
            "id",
            "kind",
            "fromId",
            "toId",
            "quantity",
            "conditionRuleIds"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/relId"
            },
            "kind": {
              "enum": [
                "choice-group"
              ]
            },
            "fromId": {
              "$ref": "#/$defs/eqId"
            },
            "toId": {
              "$ref": "#/$defs/rId"
            },
            "quantity": {
              "anyOf": [
                {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 10000
                },
                {
                  "type": "null"
                }
              ]
            },
            "conditionRuleIds": {
              "type": "array",
              "items": {
                "$ref": "#/$defs/rId"
              },
              "maxItems": 5000
            }
          },
          "required": [
            "id",
            "kind",
            "fromId",
            "toId",
            "quantity",
            "conditionRuleIds"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "$ref": "#/$defs/relId"
            },
            "kind": {
              "enum": [
                "unit-composition"
              ]
            },
            "fromId": {
              "$ref": "#/$defs/uId"
            },
            "toId": {
              "$ref": "#/$defs/cId"
            },
            "quantity": {
              "anyOf": [
                {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 10000
                },
                {
                  "type": "null"
                }
              ]
            },
            "conditionRuleIds": {
              "type": "array",
              "items": {
                "$ref": "#/$defs/rId"
              },
              "maxItems": 5000
            }
          },
          "required": [
            "id",
            "kind",
            "fromId",
            "toId",
            "quantity",
            "conditionRuleIds"
          ],
          "additionalProperties": false
        }
      ]
    },
    "issue": {
      "type": "object",
      "properties": {
        "code": {
          "enum": [
            "RULE_CONDITION_PENDING",
            "EQUIPMENT_LEGALITY_NOT_VALIDATED",
            "SYMBOL_REQUIRES_CAPABILITY",
            "VALUE_AMBIGUOUS",
            "VALUE_UNSUPPORTED"
          ]
        },
        "severity": {
          "enum": [
            "info",
            "warning",
            "error"
          ]
        },
        "entityId": {
          "$ref": "#/$defs/entityId"
        },
        "field": {
          "type": "string",
          "pattern": "^[A-Za-z][A-Za-z0-9]*$",
          "maxLength": 60
        },
        "affects": {
          "enum": [
            "selection",
            "calculation",
            "informational"
          ]
        },
        "messageCode": {
          "enum": [
            "catalog.ruleConditionPending",
            "catalog.equipmentLegalityNotValidated",
            "catalog.symbolRequiresCapability",
            "catalog.valueAmbiguous",
            "catalog.valueUnsupported"
          ]
        }
      },
      "required": [
        "code",
        "severity",
        "entityId",
        "field",
        "affects",
        "messageCode"
      ],
      "additionalProperties": false
    },
    "coverage": {
      "type": "object",
      "properties": {
        "entityId": {
          "$ref": "#/$defs/entityId"
        },
        "component": {
          "enum": [
            "characteristics",
            "equipment",
            "abilities",
            "defence"
          ]
        },
        "state": {
          "enum": [
            "complete",
            "partial",
            "not-included"
          ]
        },
        "issueCodes": {
          "type": "array",
          "items": {
            "type": "string",
            "pattern": "^[A-Z_]+$",
            "maxLength": 60
          },
          "maxItems": 5000
        }
      },
      "required": [
        "entityId",
        "component",
        "state",
        "issueCodes"
      ],
      "additionalProperties": false
    }
  }
} as const;
