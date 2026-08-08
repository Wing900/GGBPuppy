# GGB 命令搜索指南（给 agent 用）

GGBPuppy 内置 469 个 GeoGebra 命令，按类别分在 `public/ggbcommands/` 下。
**不要背全部命令**——用 `search_ggb_commands` 工具按需查。

## 一、类别目录（index.json）

| 类别 | 文件 | 命令数 | 典型命令 |
|---|---|---|---|
| 几何构造 | `geometry.json` | 24 | Point / Segment / Line / Ray / Polygon / Circle / Incircle / Conic / Ellipse / Parabola / Hyperbola / Tangent / Midpoint / Intersect / PerpendicularBisector / PerpendicularLine / AngleBisector / Locus / Envelope / Cubic / Polar |
| 测量 | `measure.json` | 72 | Distance / Angle / Area / Perimeter / Circumference / Length / Radius / Volume / Height / Slope / InteriorAngles / Side / Vertex / Center / Arc / Sector / Semicircle / Centroid / Barycenter / TriangleCenter / ConvexHull / Voronoi / Prove |
| 变换 | `transform.json` | 7 | Rotate / Reflect / Dilate / Translate / Shear / Stretch / AffineRatio |
| 代数/方程/微积分 | `algebra.json` | 93 | Solve / NSolve / CSolve / Factor / Expand / Simplify / Polynomial / Root / GCD / LCM / Divisors / PrimeFactors / Integral / Derivative / Limit / Laplace / TaylorPolynomial / Groebner / Factors |
| 统计/概率/拟合 | `stats.json` | 122 | Mean / Median / Mode / Variance / SD / Histogram / BoxPlot / BarChart / PieChart / Normal / BinomialDist / Poisson / TTest / ZTest / Fit / FitLine / FitPoly / CorrelationCoefficient / Quartile1 / SigmaXX |
| 矩阵/向量 | `matrix.json` | 26 | Determinant / Invert / Transpose / Eigenvalues / Eigenvectors / Cross / Dot / LUDecomposition / SVD / JordanDiagonalization / MatrixRank / Vector / UnitVector / ApplyMatrix |
| 文本/列表/逻辑 | `text.json` | 41 | Text / TableText / FormulaText / Split / Join / ReplaceAll / Sequence / Zip / Sort / First / Last / Take / Element / If / IsDefined / AreEqual / Prove |
| 脚本/控制/UI | `script.json` | 65 | SetColor / SetPointSize / SetLineThickness / SetFilling / SetCaption / ShowLabel / ShowAxes / ShowGrid / Slider / Button / Checkbox / InputBox / Execute / RunClickScript / StartAnimation / ZoomIn / Pan / SetCoords / SetValue / Rename / Delete / ExportImage / Turtle |
| 3D 实体 | `3d.json` | 19 | Cone / Cylinder / Sphere / Prism / Pyramid / Cube / Tetrahedron / Octahedron / Dodecahedron / Icosahedron / Net / Plane / PerpendicularPlane / InfiniteCone / Surface / Volume |

## 二、搜索策略（三级匹配）

`search_ggb_commands(query)` 按以下顺序匹配：

1. **精确匹配命令名** → 直接返回签名
2. **精确匹配签名内关键词** → 返回
3. **编辑距离（Levenshtein）** → 返回前 5 个最接近的命令名 + 距离值

### 用法要点

- **GGB 命令名全是英文**。中文意图要先转英文关键词再搜。
- **先想类别，再想关键词**：`画外接圆` → 几何构造 → 搜 `circle`。
- **搜不到就换词**：编辑距离是兜底，不是万能。搜 `circumcircle` 无果时，改搜 `circle`（外接圆 = 过三点 `Circle(A,B,C)`）。
- **多词组合**：`perpendicular bisector`、`line thickness` 这类多词直接整串搜。
- **查签名确认参数**：搜到后读 `s` 数组里的签名，确认参数类型/数量再写代码。

## 三、常见坑（务必记住）

- **没有 `Circumcircle` 命令**。外接圆 = `Circle(A, B, C)`（过三点）。
- **没有 `Incircle` 的"内切圆"歧义**：`Incircle(A, B, C)` 是三角形内切圆。
- **命令参数必须是已定义变量**，禁止嵌套未定义表达式（如 `Circle(Midpoint(A,B), 2)` 不允许，需先 `M = Midpoint(A, B)`）。
- **同名命令有多个签名**（如 `Circle( <Point>, <Radius> )` 和 `Circle( <Point>, <Segment> )`），按需选。
