/**
 * 把 ggb_brain_slim.json（683 条命令签名）按类别切分到 9 个分类文件 + index.json。
 *
 * 分类规则：按命令名关键词匹配（GGB 命令名是英文，天然带语义前缀）。
 * 每个命令只归入一个类别（按优先级从上到下，先命中先归）。
 *
 * 输出到 public/ggbcommands/：
 *   index.json      树状目录：类别 -> 命令名列表（轻量，agent 先看目录）
 *   geometry.json   几何构造
 *   measure.json    测量
 *   transform.json  变换
 *   algebra.json    代数/方程/微积分
 *   stats.json      统计/概率/拟合
 *   matrix.json     矩阵/向量
 *   text.json       文本/列表/逻辑
 *   script.json     脚本/控制/UI
 *   3d.json         3D 实体
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'public', 'ggbcommands', 'ggb_brain_slim.json');
const OUT = join(__dirname, '..', 'public', 'ggbcommands');

const raw = JSON.parse(readFileSync(SRC, 'utf8'));

// 去重：同名命令保留全部签名（合并 s 数组）
const byName = new Map();
for (const { n, s } of raw) {
  if (!byName.has(n)) byName.set(n, { n, s: new Set() });
  for (const sig of s) byName.get(n).s.add(sig);
}
const commands = [...byName.values()].map((c) => ({ n: c.n, s: [...c.s] }));

// 分类规则：数组顺序即优先级，先命中先归
const CATEGORIES = [
  {
    id: '3d',
    label: '3D 实体',
    match: /^(Cone|Cylinder|Sphere|Prism|Pyramid|Cube|Tetrahedron|Octahedron|Dodecahedron|Icosahedron|Net|Plane|PerpendicularPlane|PlaneBisector|InfiniteCone|InfiniteCylinder|Surface|Volume|Height|Net)\b/i
  },
  {
    id: 'transform',
    label: '变换',
    match: /^(Rotate|Reflect|Dilate|Translate|Shear|Stretch|AffineRatio)\b/i
  },
  {
    id: 'matrix',
    label: '矩阵/向量',
    match: /^(Determinant|Invert|Transpose|Eigenvalues|Eigenvectors|Cross|Dot|LUDecomposition|SVD|JordanDiagonalization|MatrixRank|Identity|Vector|UnitVector|UnitPerpendicularVector|PerpendicularVector|ApplyMatrix|ToComplex|ToPolar|CharacteristicPolynomial|Dimension|Direction|CurvatureVector|ReducedRowEchelonForm|QRDecomposition|MinimalPolynomial)\b/i
  },
  {
    id: 'stats',
    label: '统计/概率/拟合',
    match: /^(Mean|Median|Mode|Variance|SD|SampleSD|SampleVariance|Histogram|BoxPlot|BarChart|PieChart|DotPlot|StemPlot|StepGraph|StickGraph|Frequency|FrequencyPolygon|FrequencyTable|ContingencyTable|Normal|Binomial|Poisson|Pascal|HyperGeometric|Cauchy|ChiSquared|Exponential|Erlang|FDistribution|Gamma|LogNormal|Logistic|TDistribution|Triangular|Uniform|Weibull|Zipf|Bernoulli|Random|TTest|ZTest|ANOVA|CorrelationCoefficient|Covariance|Fit|FitExp|FitGrowth|FitImplicit|FitLine|FitLineX|FitLog|FitLogistic|FitPoly|FitPow|FitSin|RSquare|RootMeanSquare|Percentile|Quartile|Spearman|Sigma|Sxx|Sxy|Syy|TMean|ZMean|ZProportion|MAD|MeanX|MeanY|SDX|SDY|SampleSDX|SampleSDY|SumSquaredErrors|NormalQuantilePlot|ResidualPlot|LineGraph|Classes|OrdinalRank|TiedRank|RandomElement|RandomPointIn|RandomBetween|RandomBinomial|RandomDiscrete|RandomNormal|RandomPoisson|RandomPolynomial|RandomUniform|InverseNormal|InverseBinomial|InverseCauchy|InverseChiSquared|InverseExponential|InverseFDistribution|InverseGamma|InverseHyperGeometric|InverseLogNormal|InverseLogistic|InversePascal|InversePoisson|InverseTDistribution|InverseWeibull|InverseZipf|InverseBeta|InverseBinomialMinimumTrials|BetaDist|BinomialDist|ChiSquaredTest|GeometricMean|HarmonicMean|HistogramRight|Quartile1|Quartile3|SigmaXX|SigmaXY|SigmaYY|TMean2Estimate|TMeanEstimate|TTest2|TTestPaired|ZMean2Estimate|ZMean2Test|ZMeanEstimate|ZMeanTest|ZProportion2Estimate|ZProportion2Test|ZProportionEstimate|ZProportionTest)\b/i
  },
  {
    id: 'algebra',
    label: '代数/方程/微积分',
    match: /^(Solve|NSolve|CSolve|Solutions|NSolutions|CSolutions|Factor|IFactor|CFactor|CIFactor|Expand|Simplify|Polynomial|Root|RootList|ComplexRoot|GCD|LCM|Divisors|DivisorsList|DivisorsSum|PrimeFactors|NextPrime|PreviousPrime|IsPrime|Integral|IntegralBetween|IntegralSymbolic|NIntegral|Derivative|ImplicitDerivative|Limit|LimitAbove|LimitBelow|Laplace|InverseLaplace|TaylorPolynomial|Groebner|GroebnerLex|GroebnerLexDeg|GroebnerDegRevLex|Coefficients|CommonDenominator|CompleteSquare|ContinuedFraction|Degree|Denominator|Numerator|Div|Division|Eliminate|ExtendedGCD|IsFactored|IsInteger|LeftSide|RightSide|Max|Min|MixedNumber|Mod|ModularExponent|Normalize|Numeric|ParseToNumber|PartialFractions|PlotSolve|Product|RandomPolynomial|Rationalize|Substitute|Sum|ToBase|FromBase|AreEqual|Assume|BinomialCoefficient|nPr|Function|Curve|SolveCubic|SolveQuartic|SolveODE|ToExponential|ToPoint|IsVertexForm|Relation|Maximize|Minimize|IsDefined|If|KeepIf|CountIf|IsInRegion|IsTangent|IsPrime|IsFactored|IsInteger|IsVertexForm|Factors)\b/i
  },
  {
    id: 'measure',
    label: '测量',
    match: /^(Distance|Angle|Area|Perimeter|Circumference|Length|Radius|Diameter|Volume|Height|Slope|InteriorAngles|Side|Vertex|Center|Top|Bottom|Ends|PathParameter|Parameter|SemiMajorAxisLength|SemiMinorAxisLength|LinearEccentricity|Eccentricity|Curvature|Directrix|MajorAxis|MinorAxis|Focal|Focus|Sector|Semicircle|Arc|CircularArc|CircularSector|CircumcircularArc|CircumcircularSector|CrossRatio|AffineRatio|Trilinear|TriangleCenter|TriangleCurve|Barycenter|Centroid|ClosestPoint|ClosestPointRegion|IsInRegion|RandomPointIn|PointIn|ConvexHull|DelaunayTriangulation|MinimumSpanningTree|ShortestDistance|TravelingSalesman|Voronoi|AreCollinear|AreConcurrent|AreConcyclic|AreCongruent|AreParallel|ArePerpendicular|IsTangent|Prove|ProveDetails|Locus|LocusEquation|Envelope|OsculatingCircle|ConjugateDiameter|SemiMajorAxis|SemiMinorAxis|AxisStepX|AxisStepY|CASLoaded|ConstructionStep|Corner|DynamicCoordinates|Name|Object|SetConstructionStep|SlowPlot|ToolImage)\b/i
  },
  {
    id: 'text',
    label: '文本/列表/逻辑',
    match: /^(Text|TableText|FormulaText|FractionText|ScientificText|SurdText|VerticalText|RotateText|LetterToUnicode|UnicodeToLetter|UnicodeToText|TextToUnicode|Split|Join|ReplaceAll|Length|First|Last|Take|Element|Sequence|Zip|Sort|Reverse|Unique|Append|Insert|Remove|RemoveUndefined|KeepIf|CountIf|If|IsDefined|IsFactored|IsInteger|IsPrime|IsTangent|IsVertexForm|IsInRegion|AreEqual|AreParallel|ArePerpendicular|AreCollinear|AreConcurrent|AreConcyclic|AreCongruent|Max|Min|Sum|Product|Mean|Median|Mode|Sample|Shuffle|Flatten|Intersection|IndexOf|SelectedElement|SelectedIndex|Ordinal|DataFunction|Classes|Frequency|RandomElement|RandomPointIn|RootList|PointList|TiedRank|OrdinalRank|Union|Difference|Intersect|Zip|nPr|BinomialCoefficient)\b/i
  },
  {
    id: 'script',
    label: '脚本/控制/UI',
    match: /^(SetColor|SetPointSize|SetPointStyle|SetLineThickness|SetLineStyle|SetLineOpacity|SetFilling|SetCaption|SetLabelMode|ShowLabel|ShowAxes|ShowGrid|ShowLayer|SetLayer|SetConditionToShowObject|SetCoords|SetValue|SetFixed|SetDecoration|SetDynamicColor|SetBackgroundColor|SetAxesRatio|SetActiveView|SetPerspective|SetViewDirection|SetVisibleInView|SetTooltipMode|SetTrace|SetSeed|SetSpinSpeed|SetLevelOfDetail|Slider|Button|Checkbox|InputBox|Execute|RunClickScript|RunUpdateScript|StartAnimation|StartRecord|ZoomIn|ZoomOut|Pan|CenterView|AttachCopyToView|CopyFreeObject|Delete|Rename|ExportImage|PlaySound|ReadText|GetTime|HideLayer|SelectObjects|Turtle|TurtleBack|TurtleDown|TurtleForward|TurtleLeft|TurtleRight|TurtleUp|UpdateConstruction|Repeat|ParseToFunction|ParseToNumber|SetConstructionStep|SetImage|SetPerspective)\b/i
  },
  {
    id: 'geometry',
    label: '几何构造',
    match: /^(Point|Segment|Line|Ray|Polygon|Polyline|RigidPolygon|Circle|Incircle|OsculatingCircle|Semicircle|Conic|Ellipse|Parabola|Hyperbola|Tangent|Midpoint|Intersect|IntersectConic|IntersectPath|PerpendicularBisector|PerpendicularLine|AngleBisector|Angle|Axes|Plane|Sphere|Cone|Cylinder|Prism|Pyramid|Cube|Tetrahedron|Octahedron|Dodecahedron|Icosahedron|Net|Surface|Curve|Function|Locus|Envelope|Barycenter|Centroid|TriangleCenter|TriangleCurve|Trilinear|ClosestPoint|ClosestPointRegion|PointIn|RandomPointIn|IsInRegion|ConvexHull|DelaunayTriangulation|MinimumSpanningTree|ShortestDistance|TravelingSalesman|Voronoi|AreCollinear|AreConcurrent|AreConcyclic|AreCongruent|AreParallel|ArePerpendicular|IsTangent|Prove|ProveDetails|LocusEquation|CircumcircularArc|CircumcircularSector|CircularArc|CircularSector|Sector|Arc|Semicircle|OsculatingCircle|ConjugateDiameter|Directrix|Focal|Focus|MajorAxis|MinorAxis|SemiMajorAxis|SemiMinorAxis|LinearEccentricity|Eccentricity|Curvature|Parameter|PathParameter|Type|Vertex|Side|InteriorAngles|Center|Top|Bottom|Ends|Height|Volume|Perimeter|Circumference|Radius|Diameter|Distance|Angle|Area|Length|Slope|Midpoint|Intersect|IntersectConic|IntersectPath|PerpendicularBisector|PerpendicularLine|AngleBisector|Tangent|Polygon|Polyline|RigidPolygon|Segment|Line|Ray|Point|Cubic|Polar)\b/i
  }
];

// 兜底：未命中任何类别的命令
const fallback = [];

const buckets = Object.fromEntries(CATEGORIES.map((c) => [c.id, []]));
const seen = new Set();

for (const cmd of commands) {
  let placed = false;
  for (const cat of CATEGORIES) {
    if (cat.match.test(cmd.n)) {
      buckets[cat.id].push(cmd);
      seen.add(cmd.n);
      placed = true;
      break;
    }
  }
  if (!placed) fallback.push(cmd);
}

// 每个类别内按命令名排序
for (const id of Object.keys(buckets)) {
  buckets[id].sort((a, b) => a.n.localeCompare(b.n));
}
fallback.sort((a, b) => a.n.localeCompare(b.n));

// 写分类文件
mkdirSync(OUT, { recursive: true });
for (const cat of CATEGORIES) {
  const file = join(OUT, `${cat.id}.json`);
  writeFileSync(file, JSON.stringify(buckets[cat.id], null, 2) + '\n');
}

// 写 index.json（树状目录：类别 -> 命令名列表）
const index = CATEGORIES.map((cat) => ({
  id: cat.id,
  label: cat.label,
  file: `${cat.id}.json`,
  count: buckets[cat.id].length,
  commands: buckets[cat.id].map((c) => c.n)
}));
writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n');

// 报告
console.log('=== 分类结果 ===');
for (const cat of CATEGORIES) {
  console.log(`${cat.id.padEnd(10)} ${String(buckets[cat.id].length).padStart(4)}  ${cat.label}`);
}
console.log(`fallback(未命中) ${fallback.length}`);
if (fallback.length) {
  console.log('未命中命令:', fallback.map((c) => c.n).join(', '));
}
console.log('去重命令总数:', commands.length, '已分类:', seen.size);
