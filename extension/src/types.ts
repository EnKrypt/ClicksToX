export enum STAGE {
  DISCONNECTED,
  WAITING_FOR_PLAYERS_TO_JOIN,
  PLAYING,
  FINISHED,
}

export interface State {
  stage: STAGE;
  timer: number;
  source: string | undefined;
  destination: string | undefined;
  players: Array<{
    isSelf: boolean;
    isCreator: boolean;
    alias: string;
    submission: string | undefined;
    tree: Node | undefined;
    visitCount: number;
    shortestClickCount: {
      count: number;
      when: Date;
    };
  }>;
  code: string;
}

export interface Node {
  article: string;
  when: string | number;
  children: Node[];
}

export const initialGameState: State = {
  stage: STAGE.DISCONNECTED,
  timer: 0,
  source: undefined,
  destination: undefined,
  players: [],
  code: '',
};

// Uncomment this to skip the UI to a state where the game is in progress
// export const initialGameState: State = {
//   stage: STAGE.PLAYING,
//   timer: 30,
//   source: 'https://en.wikipedia.org/wiki/Jean-Luc_Picard',
//   destination: 'https://en.wikipedia.org/wiki/Adolf_Hitler',
//   players: [
//     {
//       isSelf: true,
//       isCreator: true,
//       alias: 'Arvind',
//       submission: 'https://en.wikipedia.org/wiki/Adolf_Hitler',
//       visitCount: 20,
//       tree: {
//         article: 'https://en.wikipedia.org/wiki/Jean-Luc_Picard',
//         when: 1715881002000,
//         children: [
//           {
//             article: 'https://en.wikipedia.org/wiki/Star_Trek',
//             when: 1715881002001,
//             children: [
//               {
//                 article:
//                   'https://en.wikipedia.org/wiki/United_Federation_of_Planets',
//                 when: 1715881002007,
//                 children: [
//                   {
//                     article: 'https://en.wikipedia.org/wiki/United_Nations',
//                     when: 1715881002011,
//                     children: [
//                       {
//                         article: 'https://en.wikipedia.org/wiki/World_War_II',
//                         when: 1715881002012,
//                         children: [
//                           {
//                             article:
//                               'https://en.wikipedia.org/wiki/Adolf_Hitler',
//                             when: 1715881002094,
//                             children: [],
//                           },
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//               {
//                 article: 'https://en.wikipedia.org/wiki/Starfleet',
//                 when: 1715881002008,
//                 children: [],
//               },
//               {
//                 article: 'https://en.wikipedia.org/wiki/Star_Trek:_Voyager',
//                 when: 1715881002009,
//                 children: [],
//               },
//               {
//                 article: 'https://en.wikipedia.org/wiki/Crowdfunding',
//                 when: 1715881002010,
//                 children: [],
//               },
//             ],
//           },
//           {
//             article: 'https://en.wikipedia.org/wiki/William_Shakespeare',
//             when: 1715881002005,
//             children: [],
//           },
//         ],
//       },
//       shortestClickCount: { count: 3, when: new Date(1715881002094) },
//     },
//     {
//       isSelf: false,
//       isCreator: false,
//       alias: 'Test',
//       submission: 'https://en.wikipedia.org/wiki/Adolf_Hitler',
//       visitCount: 10,
//       tree: {
//         article: 'https://en.wikipedia.org/wiki/Jean-Luc_Picard',
//         when: 1715881002000,
//         children: [
//           {
//             article: 'https://en.wikipedia.org/wiki/France',
//             when: 1715881002001,
//             children: [],
//           },
//         ],
//       },
//       shortestClickCount: { count: -1, when: new Date(1715881002000) },
//     },
//   ],
//   code: 'D6oq',
// };
