/* ============================================================
   LIZZWORD 新手教程 · 三个词的深度数据
   数据内联在 JS 中，file:// 双击打开也能读到，不经过 fetch。
   词条结构与词书深度词条保持一致：22 个顶层字段，
   senses 每条 9 个键（no/title/titleCN/definition/definitionCN/example/exampleCN/why/whyCN）。
   义项数量以真实用法为准，不硬凑。
   ============================================================ */
(function () {
  "use strict";

  window.LIZZWORD_TUTORIAL_WORDS = [
    /* ------------------------------------------------------------ hello */
    {
      word: "hello",
      ipa_uk: "/həˈləʊ/",
      ipa_us: "/həˈloʊ/",
      definition_zh: "你好；喂；嗨（打招呼或引起注意）",
      definition_en: "used as a greeting, when answering the telephone, or to get someone's attention",
      core_image: "隔着一点距离抬手招呼：我看见你了",
      scene: "清晨在楼道里遇到邻居，你抬手打招呼。 You smile and say hello to your neighbor in the hallway.",
      sceneCN: "这里 hello 是「见面时的问候」（第 1 个义项：招呼对方、表示看见你了）；句意：你在楼道里笑着和邻居打招呼。",
      pos: [
        { tag: "int.", zh: "你好；喂；嗨（打招呼或引起注意）" },
        { tag: "n.", zh: "招呼；一声「你好」" }
      ],
      collocations: [
        { phrase: "say hello to somebody", zh: "向某人打招呼" },
        { phrase: "hello there", zh: "嗨，你好啊（轻松的开场）" },
        { phrase: "a quick hello", zh: "匆匆打个招呼" },
        { phrase: "hello again", zh: "又见面了" }
      ],
      forms: [
        { label: "复数（名词）", form: "hellos" }
      ],
      derivatives: [],
      senses: [
        {
          no: "01",
          title: "A greeting when you meet someone",
          titleCN: "见面时的问候",
          definition: "used when you meet someone or begin a conversation with them",
          definitionCN: "遇见某人或开始交谈时使用的招呼语",
          example: "Hello, nice to meet you.",
          exampleCN: "你好，很高兴见到你。",
          why: "The word began as a shout that made someone stop and notice you; from there it became the standard opener of a meeting.",
          whyCN: "这个词最初是喊住对方、让对方注意到你的声音，后来固定为见面时的第一句话。"
        },
        {
          no: "02",
          title: "Answering the telephone",
          titleCN: "接电话时的「喂」",
          definition: "used when you answer the telephone or begin a phone call",
          definitionCN: "接起电话或开始通话时使用的招呼语",
          example: "Hello? Who's speaking?",
          exampleCN: "喂？请问是哪位？",
          why: "Once the telephone arrived, people needed a short signal that the line was open; hello took that job.",
          whyCN: "电话出现后，人们需要一个短促的信号来确认线路接通，hello 就承担了这个角色。"
        },
        {
          no: "03",
          title: "Calling for attention",
          titleCN: "喊住别人以引起注意",
          definition: "used to get someone's attention before you speak to them",
          definitionCN: "在对某人说话之前，先喊住对方、引起注意",
          example: "Hello! You left your bag on the bench.",
          exampleCN: "喂！你的包落在长椅上了。",
          why: "The original function was to stop someone at a distance; this use keeps that shout alive.",
          whyCN: "它最初的功能就是在远处叫住别人，这个义项保留了那声喊话。"
        },
        {
          no: "04",
          title: "Surprise or annoyance",
          titleCN: "表示惊讶或不悦（英式，较旧）",
          definition: "used to show that you are surprised or annoyed, especially in British English",
          definitionCN: "用来表示惊讶或不满，多见于英式英语，语气较旧",
          example: "Hello! That's my seat you're sitting in.",
          exampleCN: "喂！你坐的是我的位子。",
          why: "A sharp hello works like a verbal nudge: it points at something wrong before the sentence explains it.",
          whyCN: "短促尖锐的 hello 像用手肘轻推对方：先指出不对劲，再由后半句解释。"
        },
        {
          no: "05",
          title: "A greeting as a noun",
          titleCN: "招呼（名词）",
          definition: "an act of saying hello; a greeting",
          definitionCN: "打招呼的行为；一声问候",
          example: "She gave me a warm hello at the door.",
          exampleCN: "她在门口热情地跟我打了个招呼。",
          why: "Any act of speaking a greeting can be treated as a thing, so the interjection becomes a countable noun.",
          whyCN: "打招呼这个动作可以被当成一件「东西」来计数，于是感叹词变成了可数名词。"
        }
      ],
      etymology: {
        intro: {
          en: "Hello is a surprisingly recent word: it grew out of older shout-words used to stop someone and attract attention.",
          cn: "hello 其实出现得很晚：它由更早的喊话词演变而来，那些词用来叫住别人、引起注意。"
        },
        items: [
          {
            era: "1826",
            en: "hullo appears in print as a shout used to attract attention.",
            cn: "hullo 首次见于书面记录，用作喊住别人、引起注意的呼声。"
          },
          {
            era: "19TH C.",
            en: "hello becomes the common spelling and spreads widely as a greeting.",
            cn: "hello 成为常见拼写，并作为问候语广泛传播。"
          },
          {
            era: "1883",
            en: "the telephone helps hello become the standard way to open a call.",
            cn: "电话普及后，hello 成为接通电话时的标准开场语。"
          },
          {
            era: "ORIGIN",
            en: "probably an alteration of hallo, itself likely from French holà or Old High German halâ halâ, both shouts meaning 'stop there!' (details are sometimes uncertain).",
            cn: "一般认为由 hallo 变来，而 hallo 可能与法语 holà 或古高地德语 halâ halâ 有关，二者都是「站住、喂」的喊声（细节存在不确定之处）。"
          },
          {
            era: "NOTE",
            en: "The link to French or German is a likely hypothesis, not a single settled source.",
            cn: "与法语、德语的联系是较可信的假说，并非唯一确定的来源。"
          }
        ]
      },
      similar: {
        note: {
          en: "hallo and hullo are older spellings of the same word, not different words; hi and hey are near-synonyms with a lighter tone.",
          cn: "hallo、hullo 是同一个词的旧拼法，不是另外两个词；hi、hey 是语气更轻的近义词。"
        },
        groups: [
          {
            heading: "形近 / 旧拼法",
            entries: [
              {
                word: "hallo",
                ipa: "/həˈləʊ/",
                tag: "感叹词（旧式）",
                definition: "an older spelling used to greet someone or call for attention",
                definitionCN: "旧式拼法，用于问候或喊人"
              },
              {
                word: "hullo",
                ipa: "/həˈləʊ/",
                tag: "感叹词（旧式）",
                definition: "a variant spelling of hello",
                definitionCN: "hello 的变体拼写"
              }
            ]
          },
          {
            heading: "近义词",
            entries: [
              {
                word: "hi",
                ipa: "/haɪ/",
                tag: "感叹词",
                definition: "a casual greeting used especially with people you know",
                definitionCN: "熟人之间更随意的招呼"
              },
              {
                word: "hey",
                ipa: "/heɪ/",
                tag: "感叹词",
                definition: "used to greet someone or call for attention, often informally",
                definitionCN: "非正式地打招呼或喊人"
              }
            ]
          }
        ]
      },
      mnemonics: {
        normalIntro: {
          en: "Two small hooks for the sound and the gesture.",
          cn: "两个小钩子，把声音和动作连起来。"
        },
        normal: [
          {
            en: "he + llo: 'he' is the person you spot, and 'llo' is the wave that follows.",
            cn: "he 是你看到的那个人，llo 是随后抬起的手。"
          },
          {
            en: "Say it with a lifted hand: hello is a wave turned into sound.",
            cn: "说 hello 时抬手：它就是把挥手变成了声音。"
          },
          {
            en: "On the phone, hello is the doorbell of the line.",
            cn: "电话里，hello 就是线路的门铃。"
          },
          {
            en: "A warm hello and a quick hello show that the noun keeps the greeting's temperature.",
            cn: "热情的 hello 和匆忙的 hello 说明名词保留了招呼的温度。"
          }
        ],
        abstract: [
          {
            en: "Contact before content: most conversations need a doorway before a room.",
            cn: "先接触再内容：多数对话都需要先有一扇门，再进房间。"
          },
          {
            en: "One short signal can carry politeness, attention, or irritation; the tone decides.",
            cn: "同一个短信号可以承载礼貌、注意或不耐烦，决定它的是语气。"
          },
          {
            en: "A word that starts as a shout can end up as a countable social object.",
            cn: "一个从喊声开始的词，最后可以变成可以计数的社交物件。"
          }
        ]
      },
      examples: [
        {
          en: "She opened the door and said a cheerful hello.",
          cn: "她打开门，愉快地打了声招呼。"
        },
        {
          en: "Hello, is this the repair shop?",
          cn: "喂，请问是修理店吗？"
        },
        {
          en: "He gave me a quick hello and hurried away.",
          cn: "他匆匆跟我打了个招呼就走开了。"
        }
      ],
      dict_mnemonic: {
        text: "he + llo：先看到人（he），再抬手打招呼（wave）。",
        note: "拆记",
        word: "hello"
      },
      root: "一般认为源自 hallo（喊住对方），更早或与法语 holà、古高地德语 halâ 有关。",
      sensesIntro: {
        en: "Hello is mainly an opener: it creates contact before any content. The senses follow that contact from a shout to a greeting, a phone signal, and finally a countable noun.",
        cn: "hello 主要是「开场」：先建立接触，再谈内容。下面几个义项沿着这条线，从喊话到问候、再到电话信号，最后变成可数名词。"
      },
      semanticMap: {
        core: {
          en: "contact first, content later",
          cn: "先建立接触，再说内容"
        },
        chain: ["喊住对方", "确认对方听见", "见面问候", "接通电话", "引起注意", "名词化的问候"],
        branches: [
          {
            senses: "01",
            en: "The core sense: hello opens contact before any request or news.",
            cn: "核心义：在任何请求或消息之前，hello 先打开接触。"
          },
          {
            senses: "02",
            en: "Hello on the phone is a signal that the line is live, not necessarily a personal greeting.",
            cn: "电话里的 hello 是确认线路接通的信号，不一定是私人问候。"
          },
          {
            senses: "03",
            en: "At a distance, hello still does its oldest job: it makes someone stop and look.",
            cn: "隔着距离时，hello 仍在做最老的工作：让对方停下来看你。"
          },
          {
            senses: "04",
            en: "Said sharply, the same word can point at a problem rather than welcome anyone.",
            cn: "说得尖锐时，同一个词可以指向问题，而不是欢迎谁。"
          },
          {
            senses: "05",
            en: "Once people name the act, hello can be counted: a warm hello, a quick hello.",
            cn: "当人们给这个动作命名后，hello 就可以计数：一声热情的招呼、一声匆忙的招呼。"
          }
        ]
      },
      affixes: {
        intro: {
          en: "Hello has no productive prefixes or suffixes in modern English; it is learned as a whole word.",
          cn: "现代英语里 hello 没有能产的词缀，整体记更合适。"
        },
        items: [],
        latinIntro: {
          en: "No reliable Latin family member is recorded for this interjection.",
          cn: "这个感叹词没有可靠的拉丁同族词。"
        },
        latinEntries: []
      }
    },

    /* ------------------------------------------------------------ bye */
    {
      word: "bye",
      ipa_uk: "/baɪ/",
      ipa_us: "/baɪ/",
      definition_zh: "再见；回头见；（体育）轮空晋级；板球额外分",
      definition_en: "goodbye; also a free pass to the next round in a tournament, or an extra run in cricket",
      core_image: "背对镜头摆摆手：这次先走到这里",
      scene: "放学时在校门口分开，你朝朋友挥挥手。 You wave and say bye to your friend at the school gate.",
      sceneCN: "这里 bye 是「告别」（第 1 个义项：分别时的简短再见）；句意：你在校门口和朋友挥手告别。",
      pos: [
        { tag: "int.", zh: "再见；回头见（goodbye 的简短说法）" },
        { tag: "n.", zh: "告别；（体育）轮空晋级；（板球）额外分" }
      ],
      collocations: [
        { phrase: "say bye", zh: "说再见" },
        { phrase: "bye for now", zh: "先这样，回头见" },
        { phrase: "bye-bye", zh: "拜拜（随意或儿语）" },
        { phrase: "wave bye", zh: "挥手告别" }
      ],
      forms: [
        { label: "复数（名词）", form: "byes" }
      ],
      derivatives: [
        { word: "bye-bye", pos: "int.", zh: "拜拜（bye 的叠词形式，语气随意或儿语化）" }
      ],
      senses: [
        {
          no: "01",
          title: "A short farewell",
          titleCN: "简短的告别",
          definition: "used as a short, informal way of saying goodbye when you leave someone",
          definitionCN: "离开某人时，简短而随意地说再见",
          example: "Bye! See you tomorrow.",
          exampleCN: "再见！明天见。",
          why: "Bye is goodbye with the first part clipped off. The farewell meaning survives even after the word is shortened.",
          whyCN: "bye 是把 goodbye 的前半截剪掉后的形式；词变短了，告别的意思仍然完整保留。"
        },
        {
          no: "02",
          title: "A farewell as a noun",
          titleCN: "告别（名词）",
          definition: "an act or occasion of saying goodbye",
          definitionCN: "说再见的行为或场合",
          example: "We said our byes and went home.",
          exampleCN: "我们道了别，各自回家。",
          why: "Once the spoken word is treated as an event, it can be counted and used as a noun.",
          whyCN: "当说出口的告别被当成一件「事件」，它就可以计数，也可以作名词。"
        },
        {
          no: "03",
          title: "A free pass in a tournament",
          titleCN: "赛事轮空晋级",
          definition: "the right to advance to the next round without playing because there is no opponent",
          definitionCN: "因为没有对手，不比赛就直接进入下一轮的权利",
          example: "Our team drew a bye in the first round.",
          exampleCN: "我们队在第一轮抽到了轮空。",
          why: "This sense is not a farewell. It belongs to a different word, by, meaning 'on the side, incidental', and only looks the same in spelling.",
          whyCN: "这个义项不是「告别」，而属于另一个同形词 by（在旁边、附带），只是拼写看起来一样。"
        },
        {
          no: "04",
          title: "An extra run in cricket",
          titleCN: "板球中的额外分",
          definition: "a run scored when the ball passes the batsman and wicketkeeper without touching either of them",
          definitionCN: "球越过击球手和守门手且两人都没碰到时所得的额外跑分",
          example: "The batsman ran a bye.",
          exampleCN: "击球手跑得了一分额外分。",
          why: "Like the tournament sense, this is the sporting by: a score that happens on the side of normal play.",
          whyCN: "和轮空义一样，这也是体育里的 by：在正常击球之外、旁边发生的得分。"
        }
      ],
      etymology: {
        intro: {
          en: "Bye has two unrelated lives: a clipped farewell and a sporting homonym from by.",
          cn: "bye 有两条互不相关的来路：一条是截短后的告别语，一条是来自 by 的体育同形词。"
        },
        items: [
          {
            era: "16TH C.",
            en: "the blessing 'God be with ye' is contracted in writing to 'Godbwye'.",
            cn: "祝福语 God be with ye 在书面中缩写成 Godbwye。"
          },
          {
            era: "16–17TH C.",
            en: "the phrase is influenced by 'good day' and the modern-looking goodbye appears.",
            cn: "这个说法受到 good day 的影响，逐渐出现今天看到的 goodbye。"
          },
          {
            era: "17TH C.",
            en: "bye is clipped from goodbye and used on its own as a casual farewell.",
            cn: "bye 从 goodbye 中截短出来，单独使用，成为随意的告别语。"
          },
          {
            era: "19TH C.",
            en: "the sporting bye appears separately, from by meaning 'on the side, incidental'.",
            cn: "体育义的 bye 另外出现，来自表示「在旁边、附带」的 by。"
          },
          {
            era: "NOTE",
            en: "The farewell bye and the sporting bye are homonyms with different origins, not one word with many meanings.",
            cn: "告别义的 bye 与体育义的 bye 是来源不同的同形词，不是一个词延伸出很多义项。"
          }
        ]
      },
      similar: {
        note: {
          en: "Do not confuse bye with by or buy. The sporting bye is actually related to by, while the farewell bye comes from goodbye.",
          cn: "别把 bye 和 by、buy 混在一起。体育义的 bye 其实与 by 同源，告别义则来自 goodbye。"
        },
        groups: [
          {
            heading: "形近 / 同音",
            entries: [
              {
                word: "by",
                ipa: "/baɪ/",
                tag: "介词",
                definition: "near something or someone; also 'by the side of'",
                definitionCN: "在……旁边；也表示「通过、凭借」"
              },
              {
                word: "buy",
                ipa: "/baɪ/",
                tag: "动词",
                definition: "to get something by paying money for it",
                definitionCN: "用钱购买某物"
              }
            ]
          },
          {
            heading: "近义词",
            entries: [
              {
                word: "goodbye",
                ipa: "/ˌɡʊdˈbaɪ/",
                tag: "感叹词",
                definition: "the full, standard farewell",
                definitionCN: "完整、标准的告别语"
              },
              {
                word: "farewell",
                ipa: "/ˌfeəˈwel/",
                tag: "名词 / 感叹词",
                definition: "a formal or literary goodbye",
                definitionCN: "正式或带文学色彩的告别"
              },
              {
                word: "so long",
                ipa: "/ˌsəʊ ˈlɒŋ/",
                tag: "短语",
                definition: "an informal way of saying goodbye",
                definitionCN: "非正式的「再会」"
              }
            ]
          }
        ]
      },
      mnemonics: {
        normalIntro: {
          en: "Remember the cut and the wave.",
          cn: "记住「剪短」和「挥手」这两件事。"
        },
        normal: [
          {
            en: "goodbye minus 'good' and 'bye' stays: a farewell with the front cut off.",
            cn: "goodbye 剪掉前半截，剩下的 bye 还是一个完整的告别。"
          },
          {
            en: "A hand raised at the school gate is the picture for the farewell sense.",
            cn: "校门口举起的手，就是告别义的那张图。"
          },
          {
            en: "In a tournament, a bye is a seat that moves you forward without a match.",
            cn: "赛事里的 bye 是一张不用比赛就能前进的座位。"
          },
          {
            en: "In cricket, a bye slips past the batsman: a score on the side.",
            cn: "板球里的 bye 从击球手旁边溜过去，是「旁侧」的得分。"
          }
        ],
        abstract: [
          {
            en: "A shortened word can keep its full emotional weight.",
            cn: "词被剪短了，情感重量却可以一点不少。"
          },
          {
            en: "Two identical shapes can belong to two different histories; spelling is not origin.",
            cn: "两个相同的外形可以属于两段不同的历史；拼写不等于来源。"
          },
          {
            en: "A farewell is a boundary marker: it says where this meeting ends.",
            cn: "告别是一块边界标记：它说明这次见面在哪里结束。"
          }
        ]
      },
      examples: [
        {
          en: "She waved bye and ran to catch the bus.",
          cn: "她挥手告别，跑去赶公交车。"
        },
        {
          en: "Bye for now; I'll call you later.",
          cn: "先这样，回头见；我晚点打给你。"
        },
        {
          en: "The injury gave the player a bye into the final.",
          cn: "这次伤病让这名选手轮空进入决赛。"
        }
      ],
      dict_mnemonic: {
        text: "bye = goodbye 的截短；体育里的 bye 则是 by 的同形兄弟。",
        note: "同形不同源",
        word: "bye"
      },
      root: "告别义来自 God be with ye → goodbye 的截短；体育义来自 by（旁边、附带），两者同形不同源。",
      sensesIntro: {
        en: "Bye is a clipped goodbye. The tournament and cricket senses look identical but belong to a different word, by.",
        cn: "bye 是截短后的 goodbye。轮空和板球两个义项外形相同，却属于另一个词 by。"
      },
      semanticMap: {
        core: {
          en: "compress a farewell into a short, light signal",
          cn: "把告别压缩成一个轻短的信号"
        },
        chain: ["God be with ye", "Godbwye", "goodbye", "截短为 bye", "挥手告别", "名词化的告别"],
        branches: [
          {
            senses: "01",
            en: "The core farewell: one short sound closes a meeting.",
            cn: "核心告别义：一个短音结束一次见面。"
          },
          {
            senses: "02",
            en: "The spoken farewell can be counted as an event: a bye, two byes.",
            cn: "说出口的告别可以按事件计数：一次告别、两次告别。"
          },
          {
            senses: "03",
            en: "The tournament bye is not a farewell; it comes from by 'on the side'.",
            cn: "赛事轮空不是告别，它来自表示「在旁边」的 by。"
          },
          {
            senses: "04",
            en: "The cricket bye is also a side score, not a goodbye.",
            cn: "板球额外分同样是「旁侧」的得分，不是告别。"
          }
        ]
      },
      affixes: {
        intro: {
          en: "Bye has no productive affixes. bye-bye is a reduplication of the whole word, not a suffix.",
          cn: "bye 没有能产的词缀。bye-bye 是整个词的叠用，不是后缀。"
        },
        items: [
          {
            word: "bye-bye",
            structure: "bye + bye（叠词，不是后缀）",
            meaning: "a casual or childish farewell",
            meaningCN: "随意或儿语化的告别",
            example: "Bye-bye, sleep well.",
            exampleCN: "拜拜，好好睡。"
          }
        ],
        latinIntro: {
          en: "No Latin family member is recorded for this clipped English word.",
          cn: "这个英语截短词没有可靠的拉丁同族词。"
        },
        latinEntries: []
      }
    },

    /* ------------------------------------------------------------ love */
    {
      word: "love",
      ipa_uk: "/lʌv/",
      ipa_us: "/lʌv/",
      definition_zh: "爱；热爱；喜爱；（网球）零分",
      definition_en: "a strong feeling of affection, a person or thing that is loved, or zero in tennis",
      core_image: "心口的位置被另一个人占住，愿意把好东西都给出去",
      scene: "雨夜里，母亲把唯一的伞塞给孩子。 She kissed her child and said, I love you, more than anything.",
      sceneCN: "这里 love 是「爱」（第 1 个义项：对亲人深厚的感情）；句意：她亲了亲孩子，说自己爱他胜过一切。",
      pos: [
        { tag: "n.", zh: "爱；爱情；喜爱的人或事物" },
        { tag: "vt.", zh: "爱；热爱；非常喜欢" }
      ],
      collocations: [
        { phrase: "fall in love", zh: "坠入爱河" },
        { phrase: "be in love with", zh: "爱着某人" },
        { phrase: "love at first sight", zh: "一见钟情" },
        { phrase: "love to do something", zh: "很喜欢做某事" },
        { phrase: "for love", zh: "出于爱；不计报酬地" }
      ],
      forms: [
        { label: "三单（he/she/it）", form: "loves" },
        { label: "过去式（已经发生）", form: "loved" },
        { label: "过去分词（完成／被动）", form: "loved" },
        { label: "现在分词（进行体）", form: "loving" }
      ],
      derivatives: [
        { word: "lovely", pos: "adj.", zh: "可爱的；令人愉快的" },
        { word: "lovable", pos: "adj.", zh: "惹人喜爱的" },
        { word: "lover", pos: "n.", zh: "爱人；恋人" },
        { word: "beloved", pos: "adj.", zh: "深爱的；心爱的" }
      ],
      senses: [
        {
          no: "01",
          title: "Deep affection for someone",
          titleCN: "对某人深厚的感情",
          definition: "a strong feeling of caring deeply for another person",
          definitionCN: "对另一个人深切关心、牵挂的感情",
          example: "A mother's love is patient and steady.",
          exampleCN: "母亲的爱耐心而稳定。",
          why: "The oldest sense is a feeling of attachment; everything else in the word grows from that feeling.",
          whyCN: "最古老的义项是一种依恋之情；这个词的其他用法都从这份感情生长出来。"
        },
        {
          no: "02",
          title: "Romantic love",
          titleCN: "爱情",
          definition: "a feeling of romantic attraction and attachment to someone",
          definitionCN: "对某人产生的浪漫吸引与依恋",
          example: "They fell in love during their first winter together.",
          exampleCN: "他们在共度的第一个冬天坠入爱河。",
          why: "Romantic love is the affection sense narrowed to attraction between partners.",
          whyCN: "爱情是把「深厚感情」缩小到伴侣之间的吸引。"
        },
        {
          no: "03",
          title: "To like something very much",
          titleCN: "非常喜欢某物",
          definition: "to enjoy or value something greatly",
          definitionCN: "非常享受或看重某事物",
          example: "I love this song, but I cannot explain why.",
          exampleCN: "我很喜欢这首歌，但说不上为什么。",
          why: "The feeling is directed at a thing rather than a person, so the verb becomes a strong form of liking.",
          whyCN: "这份感情指向事物而不是人，于是动词变成语气很强的「喜欢」。"
        },
        {
          no: "04",
          title: "Zero in tennis",
          titleCN: "网球中的零分",
          definition: "a score of zero in tennis",
          definitionCN: "网球比赛中的零分",
          example: "The score stood at forty-love.",
          exampleCN: "比分是四十比零。",
          why: "Source uncertain: it may come from playing 'for love' (for nothing), or from French l'œuf 'egg', whose shape looks like a zero. It is not from the affection sense.",
          whyCN: "来源不确定：可能来自「为爱而玩、不计报酬」，也可能来自法语 l'œuf（蛋，形状像零）。它与「爱」的义项没有直接关系。"
        },
        {
          no: "05",
          title: "A beloved person",
          titleCN: "心爱的人（称呼）",
          definition: "a person you love, often used as a form of address",
          definitionCN: "你爱的人，常用来直接称呼对方",
          example: "Come here, my love.",
          exampleCN: "过来吧，我的心肝。",
          why: "The feeling can stand for the person who causes it, so love becomes a name for the beloved.",
          whyCN: "感情可以转指引起感情的人，于是 love 变成了对所爱之人的称呼。"
        },
        {
          no: "06",
          title: "Divine love",
          titleCN: "神之爱（宗教）",
          definition: "in religious language, God's affection for people",
          definitionCN: "宗教语境中，神对人的慈爱",
          example: "The hymn speaks of God's love for the world.",
          exampleCN: "这首赞美诗讲述神对世界的爱。",
          why: "The same affection sense is lifted to a divine scale: the one who loves is God.",
          whyCN: "仍是「深厚感情」这个义项，只是把施爱者提升到神的位置。"
        },
        {
          no: "07",
          title: "A strong pleasure in an activity",
          titleCN: "对某件事的强烈兴趣",
          definition: "a strong interest and pleasure in an activity or subject",
          definitionCN: "对某项活动或主题的强烈兴趣与乐趣",
          example: "Her love of birds began in childhood.",
          exampleCN: "她对鸟类的喜爱始于童年。",
          why: "Here love names the durable pleasure itself, not a person and not a single object.",
          whyCN: "这里 love 指的是持久的乐趣本身，既不是某个人，也不是某件具体的东西。"
        }
      ],
      etymology: {
        intro: {
          en: "Love is an old Germanic word whose history reaches back to a root meaning 'to care, desire'. The tennis sense is a separate puzzle.",
          cn: "love 是一个古老的日耳曼词，历史可以追到表示「在意、渴望」的词根。网球义则是另一个独立的谜。"
        },
        items: [
          {
            era: "OLD ENGLISH",
            en: "lufu is the Old English noun for affection and love.",
            cn: "古英语名词 lufu 表示喜爱与爱。"
          },
          {
            era: "GERMANIC",
            en: "it goes back to Proto-Germanic *lubō, a noun of affection.",
            cn: "它可追溯到原始日耳曼语 *lubō，一个表示喜爱的名词。"
          },
          {
            era: "INDO-EUROPEAN",
            en: "the deeper root is *leubh-, 'to care, desire, love'.",
            cn: "更深的词根是 *leubh-，意为「在意、渴望、爱」。"
          },
          {
            era: "COGNATES",
            en: "Old English lēof 'dear' (modern lief) and gelēafa 'belief' (modern believe) belong to the same family; Latin libet 'it pleases' and libido 'desire' are distant cousins.",
            cn: "古英语 lēof（亲爱的，今作 lief）与 gelēafa（信念，今作 believe）同属这个词族；拉丁语 libet（令人愉快）与 libido（欲望）是远亲。"
          },
          {
            era: "NOTE",
            en: "The tennis sense 'zero' is not explained by this root; its origin is uncertain.",
            cn: "网球里的「零分」不能用这个词根解释，其来源不确定。"
          }
        ]
      },
      similar: {
        note: {
          en: "lovely means 'pleasant', not 'full of love'; live and love differ by one vowel; like is weaker than love.",
          cn: "lovely 是「令人愉快的」，不是「充满爱」；live 与 love 只差一个元音；like 的语气比 love 轻。"
        },
        groups: [
          {
            heading: "形近",
            entries: [
              {
                word: "live",
                ipa: "/lɪv/",
                tag: "动词",
                definition: "to be alive or to have a home in a place",
                definitionCN: "活着；居住"
              },
              {
                word: "lovely",
                ipa: "/ˈlʌvli/",
                tag: "形容词",
                definition: "pleasant, attractive, or enjoyable",
                definitionCN: "令人愉快的；可爱的"
              },
              {
                word: "glove",
                ipa: "/ɡlʌv/",
                tag: "名词",
                definition: "a piece of clothing for the hand",
                definitionCN: "手套"
              }
            ]
          },
          {
            heading: "近义词",
            entries: [
              {
                word: "like",
                ipa: "/laɪk/",
                tag: "动词",
                definition: "to enjoy or approve of something, less strongly than love",
                definitionCN: "喜欢，语气比 love 轻"
              },
              {
                word: "adore",
                ipa: "/əˈdɔː/",
                tag: "动词",
                definition: "to love and admire someone very much",
                definitionCN: "非常爱慕、喜爱"
              },
              {
                word: "affection",
                ipa: "/əˈfekʃn/",
                tag: "名词",
                definition: "a gentle feeling of fondness or caring",
                definitionCN: "温柔的喜爱与关怀"
              }
            ]
          }
        ]
      },
      mnemonics: {
        normalIntro: {
          en: "Link the sound to the feeling, and the spelling to two people and a heart.",
          cn: "把声音连到感情，把拼写连到两个人中间的一颗心。"
        },
        normal: [
          {
            en: "love = l + o + ve: put the heart (o) between two people.",
            cn: "love = l + o + ve：把心（o）放在两个人之间。"
          },
          {
            en: "The verb loves, loved, loving behaves like any ordinary verb, even when the feeling is extraordinary.",
            cn: "loves、loved、loving 的变化和普通动词一样，尽管它表达的感情并不普通。"
          },
          {
            en: "Tennis love is a score, not a feeling: forty-love means forty to nothing.",
            cn: "网球里的 love 是比分不是感情：forty-love 就是四十比零。"
          },
          {
            en: "A love of birds is a durable pleasure, not a romance.",
            cn: "love of birds 是持久的兴趣，不是爱情。"
          },
          {
            en: "My love as a form of address turns the feeling into a name.",
            cn: "my love 这种称呼，把感情直接变成了一个名字。"
          }
        ],
        abstract: [
          {
            en: "Affection is a relation before it is a word: someone matters to someone else.",
            cn: "感情先是一种关系，然后才是一个词：某个人对另一个人很重要。"
          },
          {
            en: "The same word can point to a feeling, a person, an activity, and a number; context does the pointing.",
            cn: "同一个词可以指向感情、人、活动甚至数字；真正指路的是语境。"
          },
          {
            en: "Love is cheap to say and expensive to prove; that is why its examples stay close to daily actions.",
            cn: "说爱很便宜，证明爱很贵；所以它的例句总离不开日常动作。"
          }
        ]
      },
      examples: [
        {
          en: "They have loved each other for thirty years.",
          cn: "他们相爱已经三十年。"
        },
        {
          en: "I love walking by the river in the early morning.",
          cn: "我很喜欢清晨沿着河边散步。"
        },
        {
          en: "The crowd cheered for the player who loved the game more than the prize.",
          cn: "观众为那个热爱比赛胜过奖品的选手欢呼。"
        }
      ],
      dict_mnemonic: {
        text: "love 中间是 o：把心放在两个人之间。",
        note: "字形联想",
        word: "love"
      },
      root: "古英语 lufu，源自原始日耳曼语 *lubō，更早可追到原始印欧语 *leubh-（在意、渴望、爱）；网球零分义与这个词源无关，来源不确定。",
      sensesIntro: {
        en: "The senses move from a feeling, to the people and things that carry it, and finally to one unrelated tennis score.",
        cn: "这些义项先从感情出发，再指向承载感情的人和事物，最后延伸到与词源无关的网球比分。"
      },
      semanticMap: {
        core: {
          en: "someone or something matters enough to be held dear",
          cn: "某人或某物重要到值得珍视"
        },
        chain: ["在意某人", "珍视", "亲情之爱", "爱情", "喜爱事物或活动", "把所爱之人称作 love"],
        branches: [
          {
            senses: "01",
            en: "The core sense: deep affection for another person.",
            cn: "核心义：对另一个人深厚的感情。"
          },
          {
            senses: "02",
            en: "Romantic love narrows affection to attraction between partners.",
            cn: "爱情把「深厚感情」收窄到伴侣之间的吸引。"
          },
          {
            senses: "03",
            en: "The verb sense points the same feeling at an object: to love a song.",
            cn: "动词义把同一份感情指向事物：喜欢一首歌。"
          },
          {
            senses: "04",
            en: "The tennis zero is a separate, uncertain origin and should not be tied to affection.",
            cn: "网球零分是另一条来源不确定的线，不应与「爱」强行联系。"
          },
          {
            senses: "07",
            en: "A love of birds names a durable pleasure rather than a romance.",
            cn: "love of birds 指的是持久兴趣，而不是爱情。"
          }
        ]
      },
      affixes: {
        intro: {
          en: "Love takes several common suffixes; each one shifts the meaning in a different direction.",
          cn: "love 可以接几个常见后缀，每个后缀都把意思推向不同方向。"
        },
        items: [
          {
            word: "lovely",
            structure: "love + -ly",
            meaning: "pleasant or attractive, not 'full of love'",
            meaningCN: "令人愉快的、可爱的，不是「充满爱」",
            example: "We had a lovely afternoon.",
            exampleCN: "我们度过了一个愉快的下午。"
          },
          {
            word: "lovable",
            structure: "love + -able",
            meaning: "easy to love; deserving affection",
            meaningCN: "惹人喜爱的；值得被爱的",
            example: "He is a lovable but stubborn child.",
            exampleCN: "他是个惹人喜爱但很倔的孩子。"
          },
          {
            word: "lover",
            structure: "love + -er",
            meaning: "a person who loves, especially a romantic partner",
            meaningCN: "爱人；恋人；爱好者",
            example: "She is a lover of old films.",
            exampleCN: "她是个老电影爱好者。"
          },
          {
            word: "beloved",
            structure: "be- + loved（过去分词）",
            meaning: "dearly loved",
            meaningCN: "深受爱戴的；心爱的",
            example: "The old teacher was beloved by generations of students.",
            exampleCN: "这位老教师深受一代代学生爱戴。"
          }
        ],
        latinIntro: {
          en: "These Latin words share the deep root *leubh- but belong to the Latin branch; they are not direct ancestors of English love.",
          cn: "下面这些拉丁词与 love 共享深层词根 *leubh-，但属于拉丁语支，不是英语 love 的直接祖先。"
        },
        latinEntries: [
          {
            word: "libet",
            structure: "Latin verb",
            meaning: "it pleases; it is agreeable",
            meaningCN: "令人愉快；使人愿意"
          },
          {
            word: "libido",
            structure: "Latin noun",
            meaning: "desire, especially sexual desire",
            meaningCN: "欲望，尤指性欲"
          }
        ]
      }
    }
  ];

  /* 三个词的场景插图：内联 SVG，不新增图片文件，不依赖网络 */
  window.LIZZWORD_TUTORIAL_ART = {
    hello: `
      <svg viewBox="0 0 160 100" aria-hidden="true" focusable="false">
        <rect width="160" height="100" rx="10" fill="#f4f8ff"/>
        <path d="M16 82h128" stroke="#cfd9e8" stroke-width="2"/>
        <rect x="22" y="22" width="42" height="60" rx="4" fill="#e8eefc" stroke="#8fa3c8" stroke-width="1.6"/>
        <path d="M43 22v60" stroke="#8fa3c8" stroke-width="1.4"/>
        <circle cx="34" cy="52" r="2" fill="#8fa3c8"/>
        <circle cx="100" cy="44" r="12" fill="#ffe3cf" stroke="#a9713a" stroke-width="2"/>
        <path d="M90 35c-3-6 2-9 6-5M110 35c3-6-2-9-6-5" fill="none" stroke="#a9713a" stroke-width="2"/>
        <path d="M100 56v18M88 64l-9 10M112 64l10-8" stroke="#a9713a" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M88 86h24" stroke="#a9713a" stroke-width="2.4"/>
        <path d="M121 58c7-6 12-8 18-7" fill="none" stroke="#3157d5" stroke-width="2.2"/>
        <path d="M139 51v10" stroke="#3157d5" stroke-width="2.2"/>
        <circle cx="126" cy="30" r="13" fill="#eef3ff" stroke="#3157d5" stroke-width="1.6"/>
        <path d="M119 30c2-4 5-4 7 0M127 30c2-4 5-4 7 0" fill="none" stroke="#3157d5" stroke-width="1.6"/>
      </svg>`,
    bye: `
      <svg viewBox="0 0 160 100" aria-hidden="true" focusable="false">
        <rect width="160" height="100" rx="10" fill="#fff8f1"/>
        <path d="M18 84h124" stroke="#e2d3bf" stroke-width="2"/>
        <path d="M18 28h20v56H18zM122 28h20v56h-20z" fill="#f2e2cd" stroke="#a9713a" stroke-width="2"/>
        <path d="M28 28v56M132 28v56" stroke="#c9a87e" stroke-width="1.4"/>
        <circle cx="82" cy="40" r="11" fill="#ffe3cf" stroke="#a9713a" stroke-width="2"/>
        <path d="M73 32c-3-6 2-9 5-4M91 32c3-6-2-9-5-4" fill="none" stroke="#a9713a" stroke-width="2"/>
        <path d="M82 51v20M74 58l-12-7M90 58l13-9" stroke="#a9713a" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M70 86h24" stroke="#a9713a" stroke-width="2.4"/>
        <path d="M103 55c8 1 13 5 16 10" fill="none" stroke="#3157d5" stroke-width="2.2"/>
        <path d="M116 64l3 4 4-3" fill="none" stroke="#3157d5" stroke-width="2"/>
        <path d="M108 78c14-6 26-8 36-6" fill="none" stroke="#cfd9e8" stroke-width="2" stroke-dasharray="4 5"/>
      </svg>`,
    love: `
      <svg viewBox="0 0 160 100" aria-hidden="true" focusable="false">
        <rect width="160" height="100" rx="10" fill="#f5f7ff"/>
        <path d="M18 12l2 6M34 20l2 6M130 18l2 6M146 30l2 6M116 10l1.5 5" stroke="#9fb0d0" stroke-width="2"/>
        <path d="M50 32c0-14 34-14 34 0z" fill="#dfe8ff" stroke="#3157d5" stroke-width="2"/>
        <path d="M67 32v24c0 7-11 7-11 0" fill="none" stroke="#3157d5" stroke-width="2"/>
        <path d="M67 24v8" stroke="#3157d5" stroke-width="2"/>
        <circle cx="52" cy="56" r="9" fill="#ffe3cf" stroke="#a9713a" stroke-width="2"/>
        <path d="M52 65v16M45 70l-6 6M59 70l7 5" stroke="#a9713a" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="92" cy="62" r="7" fill="#ffe3cf" stroke="#a9713a" stroke-width="2"/>
        <path d="M92 69v10M87 73l-5 4M97 73l5 3" stroke="#a9713a" stroke-width="2" stroke-linecap="round"/>
        <path d="M84 52c3-5 10-5 12 0 2-5 9-5 12 0 0 6-12 12-12 12s-12-6-12-12z" fill="#f7b2b2" stroke="#c0505f" stroke-width="1.6"/>
        <path d="M16 88h128" stroke="#cfd9e8" stroke-width="2"/>
      </svg>`
  };
})();
