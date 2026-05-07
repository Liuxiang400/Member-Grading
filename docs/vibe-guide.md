下面是一份适合你“vibe coding”启动的项目计划书，定位是：**固定成员的任务评分与表现排名管理系统**，强调**优雅、轻便、高效、易扩展**。

---

# 项目计划书：轻量级人员任务评分管理系统

## 1. 项目定位

本项目旨在构建一个轻量级 Web 应用，用于对一组固定人员进行长期评分管理。

系统中会存在若干面向所有人的任务，每个任务会对人员分数产生影响。管理员可以快速录入任务表现、调整分数、查看历史记录，并按时间范围、学段、小组、姓名等条件筛选与排序，得到某段时间内人员表现排名。

项目核心目标不是复杂的绩效系统，而是一个**便捷、清晰、可追溯、可导入导出的分数管理工具**。

---

## 2. 核心使用场景

### 场景一：维护人员名单

管理员需要录入一批固定人员，每个人有基础字段：

| 字段   | 说明             |
| ---- | -------------- |
| 姓名   | 人员姓名           |
| 学段   | 例如小学、初中、高中、本科等 |
| 小组名  | 人员所属小组         |
| 初始分数 | 可选，默认 0        |
| 备注   | 可选             |

管理员可以新增、编辑、删除人员，也可以通过 Excel / CSV 批量导入。

---

### 场景二：创建任务并影响分数

管理员创建一个任务，例如：

> 2026-05-07 第三周作业提交情况

任务可以设置：

| 字段   | 说明                  |
| ---- | ------------------- |
| 任务名称 | 如“作业提交”“课堂表现”“项目汇报” |
| 任务日期 | 用于后续时间范围查询          |
| 任务类型 | 加分、扣分、综合评分          |
| 默认分值 | 例如默认 +5 或 -2        |
| 说明   | 任务备注                |

任务创建后，可以面向所有人员批量录入表现。

例如：

| 姓名 | 学段 | 小组 | 本次得分 | 备注   |
| -- | -- | -- | ---- | ---- |
| 张三 | 高中 | A组 | +5   | 按时完成 |
| 李四 | 高中 | B组 | -2   | 未提交  |
| 王五 | 初中 | A组 | +3   | 部分完成 |

每次任务评分都会形成一条**分数变动记录**。

---

### 场景三：查询某段时间内表现排名

管理员可以选择时间范围，例如：

> 2026-05-01 至 2026-05-31

系统会统计这段时间内每个人的分数变化，并生成排序结果。

支持筛选字段：

| 筛选项  | 示例           |
| ---- | ------------ |
| 时间范围 | 本周、本月、自定义    |
| 学段   | 初中 / 高中      |
| 小组名  | A组 / B组      |
| 姓名   | 模糊搜索         |
| 任务类型 | 作业 / 课堂 / 活动 |

排序方式：

| 排序方式     | 说明            |
| -------- | ------------- |
| 区间得分降序   | 查看某段时间内表现最好的人 |
| 总分降序     | 查看当前累计排名      |
| 扣分次数降序   | 查看问题较多的人      |
| 任务参与次数降序 | 查看参与活跃度       |
| 学段排序     | 按学段聚合展示       |
| 小组排序     | 按小组聚合展示       |

---

## 3. 产品目标

这个系统应该满足四个关键词：

### 1. 轻便

不做复杂权限系统，不做重型数据分析，不做复杂审批流。

第一版只需要：

* 人员管理
* 任务管理
* 分数录入
* 排名搜索
* 数据导入导出

### 2. 高效

管理员最常用的动作应该尽可能少点击完成。

例如：

* 创建任务后直接进入批量评分表格
* 支持复制粘贴 Excel 数据
* 支持一键应用默认分值
* 支持快速搜索姓名
* 支持按小组批量赋分

### 3. 优雅

页面不需要复杂，但需要清晰。

推荐整体风格：

* 左侧导航栏
* 中间主内容区
* 表格为核心交互
* 关键数据用卡片展示
* 筛选条件固定在顶部
* 排名结果支持颜色标识但不过度花哨

### 4. 可追溯

每一次分数变化都应该有来源。

也就是说，不能只存“某人当前多少分”，还应该保存：

* 哪个任务造成了变化
* 变化了多少分
* 什么时候变化
* 备注是什么
* 谁录入的，可在后续版本加入

---

## 4. 功能模块设计

## 模块一：仪表盘 Dashboard

用于展示系统概况。

### 展示内容

* 总人数
* 总任务数
* 今日 / 本周新增评分记录
* 当前总分 Top 5
* 本周表现 Top 5
* 扣分最多人员提醒
* 小组平均分排行

### 设计目标

打开系统后，管理员可以立刻知道：

> 最近谁表现好，谁需要关注，哪个小组整体更强。

---

## 模块二：人员管理

### 核心功能

* 新增人员
* 编辑人员
* 删除人员
* 批量导入人员
* 导出人员列表
* 按学段、小组、姓名筛选
* 查看个人详情

### 人员详情页

每个人应该有一个详情页，展示：

* 基本信息
* 当前总分
* 历史分数变化曲线
* 近期任务表现
* 加分记录
* 扣分记录
* 所属小组排名
* 所属学段排名

---

## 模块三：任务管理

### 核心功能

* 创建任务
* 编辑任务
* 删除任务
* 查看任务详情
* 查看某任务下所有人的得分情况
* 从任务进入批量评分页面

### 任务字段设计

| 字段           | 类型       | 说明      |
| ------------ | -------- | ------- |
| id           | string   | 任务唯一 ID |
| title        | string   | 任务名称    |
| date         | date     | 任务日期    |
| category     | string   | 任务分类    |
| defaultScore | number   | 默认分值    |
| description  | string   | 任务说明    |
| createdAt    | datetime | 创建时间    |

---

## 模块四：分数录入

这是系统的核心交互。

### 推荐交互方式

创建任务后，进入一个类似表格的页面：

| 姓名 | 学段 | 小组名 | 得分 | 备注   |
| -- | -- | --- | -- | ---- |
| 张三 | 高中 | A组  | 5  | 完成优秀 |
| 李四 | 高中 | A组  | 0  | 未参与  |
| 王五 | 初中 | B组  | -2 | 未提交  |

### 快捷能力

* 一键给所有人填入默认分值
* 按小组批量赋分
* 按学段批量赋分
* 支持键盘快速录入
* 支持复制粘贴 Excel 表格内容
* 支持清空当前任务评分
* 支持保存草稿
* 支持提交后生成分数记录

### 关键原则

分数录入不是直接修改人员总分，而是生成一批 score_records。

也就是说：

> 当前总分 = 初始分数 + 所有分数记录之和

这样系统才可追溯、可回滚、可统计。

---

## 模块五：搜索与排名

这是你提到的关键需求。

### 查询条件

用户可以设置：

| 查询条件        | 说明     |
| ----------- | ------ |
| 起始日期        | 统计开始时间 |
| 结束日期        | 统计结束时间 |
| 学段          | 可选     |
| 小组名         | 可选     |
| 姓名关键词       | 可选     |
| 任务分类        | 可选     |
| 是否只看加分 / 扣分 | 可选     |

### 输出结果

排名表：

| 排名 | 姓名 | 学段 | 小组名 | 区间得分 | 当前总分 | 参与任务数 | 加分次数 | 扣分次数 |
| -- | -- | -- | --- | ---: | ---: | ----: | ---: | ---: |

### 排序方式

* 按区间得分排序
* 按当前总分排序
* 按参与任务数排序
* 按加分次数排序
* 按扣分次数排序
* 按学段排序
* 按小组排序
* 按姓名排序

### 高级展示

可以加入：

* 小组排行榜
* 学段排行榜
* 个人趋势图
* 区间内进步最多的人
* 区间内扣分最多的人

---

## 模块六：数据导入与导出

### 导入能力

支持 CSV / Excel 导入：

1. 人员名单导入
2. 任务评分导入
3. 历史分数记录导入

### 导入人员模板

| 姓名 | 学段 | 小组名 | 初始分数 | 备注 |
| -- | -- | --- | ---: | -- |

### 导入评分模板

| 任务名称 | 任务日期 | 姓名 | 学段 | 小组名 | 得分 | 备注 |
| ---- | ---- | -- | -- | --- | -: | -- |

### 导出能力

支持导出：

* 当前人员总分表
* 某时间范围内排名表
* 某个任务的评分表
* 某个人的历史记录
* 全量备份数据

推荐格式：

* CSV：轻便，适合通用导入导出
* Excel：更适合给老师、助教或管理者查看
* JSON：适合系统备份和迁移

---

# 5. 数据模型设计

建议第一版使用清晰的三表结构。

## 5.1 Person 人员表

```ts
type Person = {
  id: string;
  name: string;
  stage: string;
  groupName: string;
  initialScore: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
};
```

---

## 5.2 Task 任务表

```ts
type Task = {
  id: string;
  title: string;
  date: string;
  category?: string;
  defaultScore?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
};
```

---

## 5.3 ScoreRecord 分数记录表

```ts
type ScoreRecord = {
  id: string;
  personId: string;
  taskId: string;
  scoreDelta: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
};
```

---

## 5.4 计算逻辑

### 当前总分

```ts
currentScore = person.initialScore + sum(all scoreDelta of this person)
```

### 区间得分

```ts
rangeScore = sum(scoreDelta where task.date between startDate and endDate)
```

### 区间排名

```ts
rank by rangeScore desc
```

### 当前总分排名

```ts
rank by currentScore desc
```

---

# 6. 页面结构设计

推荐页面结构如下：

```txt
/
├── Dashboard 仪表盘
├── People 人员管理
│   ├── 人员列表
│   └── 人员详情
├── Tasks 任务管理
│   ├── 任务列表
│   ├── 创建任务
│   └── 任务评分
├── Ranking 搜索与排名
├── ImportExport 导入导出
└── Settings 设置
```

---

## 6.1 仪表盘页面

核心组件：

* 数据概览卡片
* 当前总分 Top 5
* 本周表现 Top 5
* 小组平均分
* 最近任务记录

---

## 6.2 人员页面

核心组件：

* 人员表格
* 顶部筛选栏
* 新增人员按钮
* 导入人员按钮
* 导出按钮

表格字段：

| 姓名 | 学段 | 小组名 | 当前总分 | 最近得分 | 操作 |
| -- | -- | --- | ---: | ---: | -- |

---

## 6.3 任务页面

核心组件：

* 任务列表
* 创建任务弹窗
* 任务详情
* 进入评分按钮

任务表格：

| 任务名称 | 日期 | 分类 | 默认分值 | 已评分人数 | 操作 |
| ---- | -- | -- | ---: | ----: | -- |

---

## 6.4 排名页面

核心组件：

* 时间范围选择器
* 学段筛选
* 小组筛选
* 姓名搜索
* 排序选择
* 排名表格
* 导出当前结果按钮

---

# 7. 技术方案建议

## 方案 A：最轻量本地版

适合个人、小团队、课程管理。

### 技术栈

* 前端：React / Next.js
* UI：Tailwind CSS + shadcn/ui
* 数据库：SQLite
* ORM：Prisma
* 导入导出：xlsx / papaparse
* 部署：本地运行或 Vercel + Turso

### 优点

* 开发快
* 结构清晰
* 维护成本低
* 很适合 vibe coding

### 推荐程度

**最高。**

---

## 方案 B：纯前端本地存储版

适合极简原型。

### 技术栈

* React
* Tailwind CSS
* IndexedDB / LocalStorage
* xlsx 导入导出

### 优点

* 不需要后端
* 很快能做出可用 Demo
* 适合单人使用

### 缺点

* 数据可靠性弱
* 多设备同步麻烦
* 不适合多人协作

### 推荐程度

适合第一天快速做原型。

---

## 方案 C：多人在线版

适合正式使用。

### 技术栈

* Next.js
* PostgreSQL
* Prisma
* Auth.js
* shadcn/ui
* Vercel / Railway / Supabase

### 优点

* 可多人协作
* 数据安全性更好
* 后续可加权限

### 缺点

* 开发复杂度更高

### 推荐程度

适合第二阶段升级。

---

# 8. 推荐 MVP 版本

第一版不要做太大。建议 MVP 只做以下内容：

## MVP 必做功能

1. 人员列表
2. 新增 / 编辑 / 删除人员
3. 创建任务
4. 对任务批量录入分数
5. 自动计算当前总分
6. 按时间范围查询区间得分
7. 按学段、小组、姓名筛选
8. 排名表导出 CSV
9. 人员数据导入 CSV

---

## MVP 暂不做

第一版可以先不做：

* 登录系统
* 多角色权限
* 复杂图表
* 自动通知
* 移动端深度适配
* 审批流
* 分数申诉
* AI 分析总结

这些功能后续再加，不要一开始拖慢开发。

---

# 9. 交互设计原则

## 9.1 表格优先

这个项目的核心不是炫酷界面，而是高效管理数据。

所以主交互应该围绕表格：

* 人员表格
* 任务表格
* 评分表格
* 排名表格

---

## 9.2 筛选栏固定在顶部

排名页面建议设计成：

```txt
[开始日期] [结束日期] [学段] [小组] [姓名搜索] [排序方式] [导出]
--------------------------------------------------------
排名表格
```

用户可以快速调整条件，立即看到结果。

---

## 9.3 所有分数变化都要可解释

不要只显示：

> 张三：85 分

还应该能点开看到：

```txt
初始分：60
作业提交：+5
课堂表现：+3
迟到：-2
项目展示：+10
当前总分：76
```

这会让系统更可靠。

---

# 10. 开发路线图

## 第一阶段：原型版

目标：跑通核心流程。

功能：

* 人员 CRUD
* 任务 CRUD
* 任务评分
* 当前总分计算
* 区间排名
* CSV 导入导出

建议页面：

* People
* Tasks
* Ranking

这一阶段完成后，系统已经可以真实使用。

---

## 第二阶段：体验优化版

目标：让录入更快，查询更舒服。

功能：

* 批量赋分
* Excel 粘贴
* 保存评分草稿
* 个人详情页
* 小组统计
* 学段统计
* 任务详情页
* 排名导出 Excel

---

## 第三阶段：正式使用版

目标：多人协作、数据安全。

功能：

* 登录系统
* 管理员权限
* 操作日志
* 数据备份
* 多端同步
* 导入校验
* 重复人员检测
* 分数记录回滚

---

## 第四阶段：智能分析版

目标：辅助管理者理解数据。

功能：

* 自动生成周报
* 自动识别进步明显的人
* 自动识别持续扣分的人
* 小组趋势分析
* 个人表现摘要
* 异常分数提醒

---

# 11. 推荐数据库结构

如果使用 Prisma，可以初步设计为：

```prisma
model Person {
  id           String        @id @default(cuid())
  name         String
  stage        String
  groupName    String
  initialScore Float         @default(0)
  note         String?
  records      ScoreRecord[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Task {
  id           String        @id @default(cuid())
  title        String
  date         DateTime
  category     String?
  defaultScore Float?
  description  String?
  records      ScoreRecord[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model ScoreRecord {
  id          String   @id @default(cuid())
  personId    String
  taskId      String
  scoreDelta  Float
  note        String?
  person      Person   @relation(fields: [personId], references: [id])
  task        Task     @relation(fields: [taskId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([personId, taskId])
}
```

这里的 `@@unique([personId, taskId])` 表示：

> 同一个人在同一个任务下只能有一条评分记录。

这样可以避免重复评分。

---

# 12. 核心 API 设计

如果做成 Next.js API，可以有这些接口：

## 人员接口

```txt
GET    /api/people
POST   /api/people
PATCH  /api/people/:id
DELETE /api/people/:id
```

## 任务接口

```txt
GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
```

## 评分接口

```txt
GET    /api/tasks/:id/scores
POST   /api/tasks/:id/scores/batch
PATCH  /api/scores/:id
DELETE /api/scores/:id
```

## 排名接口

```txt
GET /api/ranking?startDate=2026-05-01&endDate=2026-05-31&stage=高中&groupName=A组&sort=rangeScore
```

## 导入导出接口

```txt
POST /api/import/people
POST /api/import/scores
GET  /api/export/people
GET  /api/export/ranking
```

---

# 13. 排名查询逻辑

排名页的核心逻辑可以抽象成：

```ts
type RankingQuery = {
  startDate?: string;
  endDate?: string;
  stage?: string;
  groupName?: string;
  name?: string;
  sortBy?: "rangeScore" | "currentScore" | "taskCount" | "bonusCount" | "penaltyCount";
  order?: "asc" | "desc";
};
```

返回：

```ts
type RankingItem = {
  personId: string;
  name: string;
  stage: string;
  groupName: string;
  initialScore: number;
  currentScore: number;
  rangeScore: number;
  taskCount: number;
  bonusCount: number;
  penaltyCount: number;
  rank: number;
};
```

---

# 14. 一个优雅的首页布局设想

```txt
┌──────────────────────────────────────────────┐
│ ScoreFlow                                    │
│ 轻量级任务评分管理系统                         │
├──────────────┬───────────────────────────────┤
│ Dashboard    │  总人数    总任务    本周记录    │
│ People       │  128       36        542        │
│ Tasks        │                               │
│ Ranking      │  本周表现 Top 5                 │
│ Import       │  1. 张三 +24                    │
│ Settings     │  2. 李四 +21                    │
│              │  3. 王五 +18                    │
└──────────────┴───────────────────────────────┘
```

项目名称可以叫：

* ScoreFlow
* PointBoard
* TaskRank
* ClassScore
* MeritBoard
* RankLite

我比较推荐：**ScoreFlow**。

它表达的是：

> 分数不是静态数字，而是由一系列任务表现流动累积而来。

---

# 15. 最小可实现版本 Prompt

如果你要直接交给 AI 编程工具，可以这样描述：

```txt
请帮我实现一个轻量级任务评分管理系统，项目名为 ScoreFlow。

技术栈使用 Next.js + TypeScript + Tailwind CSS + shadcn/ui + Prisma + SQLite。

核心需求：
1. 系统管理一批固定人员。
2. 人员字段包括：姓名、学段、小组名、初始分数、备注。
3. 可以新增、编辑、删除人员。
4. 可以创建任务，任务字段包括：任务名称、任务日期、分类、默认分值、说明。
5. 每个任务可以对所有人员进行批量评分。
6. 分数不要直接写入人员表，而是保存为 ScoreRecord 记录。
7. 当前总分 = 初始分数 + 所有 ScoreRecord 的 scoreDelta 之和。
8. 排名页支持按时间范围统计区间得分。
9. 排名页支持按学段、小组名、姓名关键词筛选。
10. 排名页支持按区间得分、当前总分、参与任务数、加分次数、扣分次数排序。
11. 支持人员 CSV 导入。
12. 支持排名结果 CSV 导出。
13. 页面风格要求简洁、优雅、轻便，主交互以表格为核心。
14. 使用左侧导航栏，包含 Dashboard、People、Tasks、Ranking、Import/Export。
15. 请先实现 MVP，保证代码结构清晰，后续方便扩展。
```

---

# 16. 项目成功标准

第一版完成后，只要能做到下面这些，就已经成功：

1. 可以维护固定人员名单。
2. 可以创建任务。
3. 可以给任务批量录入分数。
4. 可以自动计算每个人当前总分。
5. 可以查询某个时间范围内的表现排名。
6. 可以按学段、小组、姓名筛选。
7. 可以导入和导出数据。
8. 每一次分数变化都有记录可查。

这个项目的核心价值在于：

> 把“人、任务、分数变化、时间范围排名”这四件事用一个非常轻的系统串起来。

我的建议是：第一版不要追求大而全，先做成一个**表格体验极佳的 ScoreFlow MVP**。只要录入流畅、排名准确、导入导出稳定，它就已经非常实用了。
