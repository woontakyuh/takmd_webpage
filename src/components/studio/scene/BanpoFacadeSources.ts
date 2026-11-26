// Derived from geography.json; generator and geographic audit are recorded in FACADES.md.
export interface BanpoFacadeSpec {
  readonly osmIndex: number;
  readonly osmId: number;
  readonly edgeIndex: number;
  readonly edge: readonly [readonly [east: number, north: number], readonly [east: number, north: number]];
  readonly base: number;
  readonly height: number;
}

export const BANPO_FACADE_SOURCES: readonly BanpoFacadeSpec[] = [
  {"osmIndex":484,"osmId":412469488,"edgeIndex":1,"edge":[[-1504.9,1227.8],[-1480.5,1284.6]],"base":17.8,"height":62},
  {"osmIndex":318,"osmId":610247143,"edgeIndex":2,"edge":[[-1044,805.7],[-1070.7,793.6]],"base":23.6,"height":129.3},
  {"osmIndex":514,"osmId":416497697,"edgeIndex":3,"edge":[[-1162,1117.6],[-1150.9,1148.7]],"base":21.4,"height":60},
  {"osmIndex":258,"osmId":415432145,"edgeIndex":2,"edge":[[-1276.6,1004.9],[-1264.7,1034.4]],"base":20.4,"height":61},
  {"osmIndex":159,"osmId":415432146,"edgeIndex":2,"edge":[[-1199.1,975.8],[-1188.4,1003.7]],"base":21.1,"height":61},
  {"osmIndex":104,"osmId":412420695,"edgeIndex":1,"edge":[[-1341.8,918.2],[-1326.3,957.2]],"base":22.3,"height":36.6},
  {"osmIndex":12,"osmId":222019376,"edgeIndex":1,"edge":[[-1430.6,2281.2],[-1334,2281.2]],"base":22.8,"height":30.5},
  {"osmIndex":135,"osmId":416550355,"edgeIndex":0,"edge":[[-189.1,891.3],[-86.5,889.7]],"base":21.8,"height":39.6},
  {"osmIndex":269,"osmId":416550354,"edgeIndex":0,"edge":[[-96.5,951.9],[-12.7,953.1]],"base":20.9,"height":39.6},
  {"osmIndex":154,"osmId":416550352,"edgeIndex":0,"edge":[[-325.2,930.8],[-226.3,931.8]],"base":26.9,"height":39.6},
  {"osmIndex":150,"osmId":416550351,"edgeIndex":0,"edge":[[-322.3,871.9],[-223.4,872.9]],"base":25.7,"height":39.6},
  {"osmIndex":153,"osmId":416550350,"edgeIndex":0,"edge":[[-319.8,815.5],[-220.9,816.6]],"base":26.5,"height":39.6},
  {"osmIndex":267,"osmId":416550353,"edgeIndex":0,"edge":[[-194.3,953.3],[-110.4,953.1]],"base":24,"height":39.6},
  {"osmIndex":151,"osmId":416550347,"edgeIndex":0,"edge":[[-437.9,926.6],[-339,927.7]],"base":27.1,"height":39.6},
  {"osmIndex":149,"osmId":416550348,"edgeIndex":0,"edge":[[-435.4,865.8],[-336.5,866.8]],"base":27.4,"height":39.6},
  {"osmIndex":103,"osmId":123723374,"edgeIndex":1,"edge":[[286.1,2159.7],[226.1,2073.8]],"base":49.9,"height":36.6},
  {"osmIndex":279,"osmId":123723368,"edgeIndex":0,"edge":[[268.4,2218.2],[197.9,2188.7]],"base":47.3,"height":36.6},
  {"osmIndex":109,"osmId":123724521,"edgeIndex":9,"edge":[[815.7,1580.9],[777.3,1582.9]],"base":48.3,"height":40},
  {"osmIndex":92,"osmId":1356115056,"edgeIndex":5,"edge":[[66.8,1382.9],[113.1,1390.7]],"base":28.5,"height":35},
  {"osmIndex":710,"osmId":431589104,"edgeIndex":0,"edge":[[-7.7,1443.7],[34,1442.7]],"base":24.5,"height":48},
  {"osmIndex":611,"osmId":431589103,"edgeIndex":1,"edge":[[39.6,1382.8],[40.5,1430.6]],"base":25.7,"height":48},
  {"osmIndex":299,"osmId":123723366,"edgeIndex":2,"edge":[[329.2,2274],[289.7,2225.6]],"base":57.6,"height":36.6},
  {"osmIndex":454,"osmId":123723376,"edgeIndex":2,"edge":[[191.3,2185.7],[148.3,2154.7]],"base":41.4,"height":36.6},
  {"osmIndex":62,"osmId":839652166,"edgeIndex":3,"edge":[[150.9,2047.1],[132,2023.5]],"base":39.7,"height":60},
  {"osmIndex":490,"osmId":1111215703,"edgeIndex":15,"edge":[[1086.5,2102.7],[1038.9,2089.1]],"base":54.6,"height":43},
  {"osmIndex":675,"osmId":1486724584,"edgeIndex":2,"edge":[[1232,2008.2],[1261.2,2033.3]],"base":19.6,"height":56},
  {"osmIndex":120,"osmId":663615015,"edgeIndex":0,"edge":[[1092.7,1882.3],[1119.5,1904.8]],"base":25.4,"height":52},
  {"osmIndex":146,"osmId":1486724180,"edgeIndex":8,"edge":[[1423.2,2423.4],[1387.4,2411.2]],"base":14.2,"height":55},
  {"osmIndex":191,"osmId":663615017,"edgeIndex":0,"edge":[[1169,1949.3],[1195.5,1971.8]],"base":26.5,"height":52},
  {"osmIndex":615,"osmId":1111215706,"edgeIndex":7,"edge":[[1099.9,2049.4],[1068.6,2040.6]],"base":43.5,"height":45},
  {"osmIndex":30,"osmId":1089000014,"edgeIndex":3,"edge":[[1428.3,2683],[1475,2739.9]],"base":19.9,"height":45},
  {"osmIndex":607,"osmId":1430405936,"edgeIndex":1,"edge":[[1990,784.6],[1951.8,794.6]],"base":17.6,"height":109},
  {"osmIndex":227,"osmId":700865396,"edgeIndex":0,"edge":[[1937.9,884.5],[1969.6,863.4]],"base":21.6,"height":76},
  {"osmIndex":695,"osmId":700865399,"edgeIndex":1,"edge":[[1922.1,1018.4],[1966.6,1026.6]],"base":27,"height":76},
  {"osmIndex":459,"osmId":469650431,"edgeIndex":0,"edge":[[2089.8,1053.5],[2148.2,1039.1]],"base":20.2,"height":54},
  {"osmIndex":461,"osmId":469650430,"edgeIndex":0,"edge":[[2073.8,997],[2132.1,982.6]],"base":18.9,"height":50},
  {"osmIndex":442,"osmId":431800084,"edgeIndex":1,"edge":[[1797.1,914.6],[1859.5,971.5]],"base":26,"height":57.9},
  {"osmIndex":357,"osmId":431800079,"edgeIndex":0,"edge":[[1765.5,883.7],[1808.7,869.8]],"base":21.6,"height":45.8},
  {"osmIndex":527,"osmId":700865401,"edgeIndex":0,"edge":[[1923.9,972.7],[1941.4,957.4]],"base":23.1,"height":96},
  {"osmIndex":206,"osmId":431800077,"edgeIndex":1,"edge":[[1629.2,809.6],[1692.4,885.5]],"base":16.5,"height":33.5},
  {"osmIndex":574,"osmId":469650424,"edgeIndex":0,"edge":[[2042.8,1029.6],[2025.4,953.5]],"base":17.3,"height":54.9},
  {"osmIndex":23,"osmId":972418564,"edgeIndex":0,"edge":[[2379.5,1104.4],[2401.9,1010.1]],"base":21.7,"height":65},
  {"osmIndex":561,"osmId":1359383617,"edgeIndex":0,"edge":[[2342.1,906.8],[2351,870.5]],"base":27.1,"height":57},
  {"osmIndex":19,"osmId":1193574792,"edgeIndex":6,"edge":[[2305.3,912.6],[2355.6,925.5]],"base":36,"height":47},
  {"osmIndex":240,"osmId":469368414,"edgeIndex":5,"edge":[[2416.8,1432.7],[2392.8,1470.3]],"base":26.6,"height":51.8},
  {"osmIndex":549,"osmId":1078788197,"edgeIndex":0,"edge":[[2412.4,955.4],[2419.1,927.2]],"base":34.6,"height":56},
  {"osmIndex":155,"osmId":561305974,"edgeIndex":1,"edge":[[2319.7,1566.7],[2372.8,1599.4]],"base":21.1,"height":51.8},
  {"osmIndex":137,"osmId":432034150,"edgeIndex":1,"edge":[[2471,1689.7],[2552,1742.5]],"base":23.7,"height":42.7},
  {"osmIndex":378,"osmId":436407207,"edgeIndex":1,"edge":[[2408.4,1484.7],[2466,1520.9]],"base":25.2,"height":51.8},
];
