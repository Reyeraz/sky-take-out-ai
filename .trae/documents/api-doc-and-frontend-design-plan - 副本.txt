# 苍穹外卖 - 接口文档 & 前端设计建议

---

## 一、统一响应格式

所有接口返回均被 `Result<T>` 包装：

```json
{
  "code": 1,        // Integer: 1=成功, 0=失败
  "msg": null,      // String: 失败时的错误信息
  "data": <T>       // 泛型: 具体返回数据
}
```

分页接口 `data` 字段为 `PageResult` 结构：

```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 100,              // long: 总记录数
    "records": [ ... ]         // List: 当前页数据数组
  }
}
```

---

## 二、管理端接口 (Admin) — 10 个 Controller，43 个端点

### 2.1 EmployeeController — 员工管理 `/admin/employee`

#### POST `/admin/employee/login` — 员工登录

**请求体**:
```json
{
  "username": "admin",     // String
  "password": "123456"     // String
}
```

**响应 JSON** (`Result<EmployeeLoginVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "id": 1,                // Long
    "userName": "admin",    // String
    "name": "管理员",        // String
    "token": "eyJhbG..."    // String: JWT令牌
  }
}
```

---

#### POST `/admin/employee/logout` — 员工退出

**响应 JSON** (`Result<String>`):
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

#### POST `/admin/employee` — 新增员工

**请求体**:
```json
{
  "id": null,              // Long (新增时不传)
  "username": "zhangsan",  // String
  "name": "张三",          // String
  "phone": "13800138000",  // String
  "sex": "1",              // String
  "idNumber": "..."        // String 身份证号
}
```

**响应 JSON** (`Result`):
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

#### GET `/admin/employee/page` — 员工分页查询

**请求参数** (Query):
```
name=张&page=1&pageSize=10
```

**响应 JSON** (`Result<PageResult>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 50,
    "records": [
      {
        "id": 1,
        "username": "admin",
        "name": "管理员",
        "password": null,
        "phone": "13800138001",
        "sex": "1",
        "idNumber": "...",
        "status": 1,
        "createTime": "2024-01-01T10:00:00",
        "updateTime": "2024-01-01T10:00:00",
        "createUser": 1,
        "updateUser": 1
      }
    ]
  }
}
```

---

#### POST `/admin/employee/status/{status}` — 启用/禁用员工

**请求参数**: Path `status` = 1(启用)/0(禁用), Query `id` = 员工ID

**响应 JSON** (`Result`):
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

#### GET `/admin/employee/{id}` — 根据ID查询员工

**响应 JSON** (`Result<Employee>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "id": 1,
    "username": "admin",
    "name": "管理员",
    "phone": "13800138001",
    "sex": "1",
    "idNumber": "...",
    "status": 1,
    "createTime": "2024-01-01T10:00:00",
    "updateTime": "2024-01-01T10:00:00",
    "createUser": 1,
    "updateUser": 1
  }
}
```

---

#### PUT `/admin/employee` — 编辑员工信息

**请求体** 同新增，带 `id` 字段。

**响应 JSON** (`Result`):
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

### 2.2 CategoryController — 分类管理 `/admin/category`

#### POST `/admin/category` — 新增分类

**请求体**:
```json
{
  "name": "热门菜品",    // String
  "sort": 1,             // Integer
  "type": 1              // Integer: 1=菜品分类, 2=套餐分类
}
```

**响应 JSON** (`Result<String>`):
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

#### GET `/admin/category/page` — 分类分页查询

**请求参数**: `name`, `type`, `page`, `pageSize`

**响应 JSON** (`Result<PageResult>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 10,
    "records": [
      {
        "id": 1,
        "type": 1,
        "name": "热门菜品",
        "sort": 1,
        "status": 1,
        "createTime": "2024-01-01T10:00:00",
        "updateTime": "2024-01-01T10:00:00",
        "createUser": 1,
        "updateUser": 1
      }
    ]
  }
}
```

---

#### DELETE `/admin/category` — 删除分类

**请求参数**: Query `id`

**响应 JSON** (`Result<String>`):
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

#### PUT `/admin/category` — 修改分类

**请求体** 同新增，带 `id` 字段。

**响应 JSON**: 同上删除。

---

#### POST `/admin/category/status/{status}` — 启用/禁用分类

**请求参数**: Path `status` = 1/0, Query `id`

**响应 JSON**: `Result<String>`, 同删除。

---

#### GET `/admin/category/list` — 根据类型查询分类

**请求参数**: Query `type` (1=菜品分类, 2=套餐分类)

**响应 JSON** (`Result<List<Category>>`):
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "id": 1,
      "type": 1,
      "name": "热门菜品",
      "sort": 1,
      "status": 1,
      "createTime": "2024-01-01T10:00:00",
      "updateTime": "2024-01-01T10:00:00",
      "createUser": 1,
      "updateUser": 1
    }
  ]
}
```

---

### 2.3 DishController — 菜品管理 `/admin/dish`

#### POST `/admin/dish` — 新增菜品

**请求体**:
```json
{
  "name": "宫保鸡丁",
  "categoryId": 1,
  "price": 28.00,
  "image": "xxx.jpg",
  "description": "经典川菜",
  "status": 1,
  "flavors": [
    { "name": "辣度", "value": "[\"微辣\",\"中辣\",\"重辣\"]" }
  ]
}
```

**响应 JSON** (`Result`):
```json
{ "code": 1, "msg": null, "data": null }
```

---

#### GET `/admin/dish/page` — 菜品分页查询

**请求参数**: `name`, `categoryId`, `status`, `page`, `pageSize`

**响应 JSON** (`Result<PageResult>`): `records` 元素为 `DishVO`（见下方 `getById` 响应结构）。

---

#### DELETE `/admin/dish` — 批量删除菜品

**请求参数**: Query `ids` = 1,2,3 (逗号分隔的多值)

**响应 JSON**: `Result`, `data` 为 null。

---

#### GET `/admin/dish/{id}` — 根据ID查询菜品

**响应 JSON** (`Result<DishVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "id": 1,
    "name": "宫保鸡丁",
    "categoryId": 1,
    "price": 28.00,
    "image": "http://xxx.jpg",
    "description": "经典川菜",
    "status": 1,
    "updateTime": "2024-01-01T10:00:00",
    "categoryName": "热门菜品",
    "flavors": [
      { "id": 1, "dishId": 1, "name": "辣度", "value": "[\"微辣\",\"中辣\",\"重辣\"]" }
    ]
  }
}
```

---

#### PUT `/admin/dish` — 修改菜品

**请求体** 同新增，带 `id`。**响应 JSON**: `Result`, `data` 为 null。

---

#### POST `/admin/dish/status/{status}` — 菜品起售/停售

**请求参数**: Path `status` = 1(起售)/0(停售), Query `id`

**响应 JSON** (`Result<String>`):
```json
{ "code": 1, "msg": null, "data": null }
```

---

#### GET `/admin/dish/list` — 根据分类ID查询菜品

**请求参数**: Query `categoryId`

**响应 JSON** (`Result<List<Dish>>`):
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "id": 1,
      "name": "宫保鸡丁",
      "categoryId": 1,
      "price": 28.00,
      "image": "xxx.jpg",
      "description": "经典川菜",
      "status": 1,
      "createTime": "2024-01-01T10:00:00",
      "updateTime": "2024-01-01T10:00:00",
      "createUser": 1,
      "updateUser": 1
    }
  ]
}
```

---

### 2.4 SetmealController — 套餐管理 `/admin/setmeal`

#### POST `/admin/setmeal` — 新增套餐

**请求体**:
```json
{
  "categoryId": 2,
  "name": "双人优惠套餐",
  "price": 68.00,
  "status": 1,
  "description": "超值套餐",
  "image": "xxx.jpg",
  "setmealDishes": [
    { "dishId": 1, "name": "宫保鸡丁", "price": 28.00, "copies": 1 },
    { "dishId": 2, "name": "酸辣汤", "price": 18.00, "copies": 2 }
  ]
}
```

**响应 JSON**: `Result`, `data` 为 null。

---

#### GET `/admin/setmeal/page` — 套餐分页查询

**请求参数**: `name`, `categoryId`, `status`, `page`, `pageSize`

**响应 JSON** (`Result<PageResult>`): `records` 元素为 `SetmealVO`（见下方）。

---

#### DELETE `/admin/setmeal` — 批量删除套餐

**请求参数**: Query `ids` = 1,2,3

**响应 JSON**: `Result`, `data` 为 null。

---

#### GET `/admin/setmeal/{id}` — 根据ID查询套餐

**响应 JSON** (`Result<SetmealVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "id": 1,
    "categoryId": 2,
    "name": "双人优惠套餐",
    "price": 68.00,
    "status": 1,
    "description": "超值套餐",
    "image": "http://xxx.jpg",
    "updateTime": "2024-01-01T10:00:00",
    "categoryName": "优惠套餐",
    "setmealDishes": [
      { "id": 1, "setmealId": 1, "dishId": 1, "name": "宫保鸡丁", "price": 28.00, "copies": 1 },
      { "id": 2, "setmealId": 1, "dishId": 2, "name": "酸辣汤", "price": 18.00, "copies": 2 }
    ]
  }
}
```

---

#### PUT `/admin/setmeal` — 修改套餐

**请求体** 同新增，带 `id`。**响应 JSON**: `Result`, `data` 为 null。

---

#### POST `/admin/setmeal/status/{status}` — 套餐起售/停售

**请求参数**: Path `status` = 1/0, Query `id`

**响应 JSON**: `Result`, `data` 为 null。

---

### 2.5 OrderController — 订单管理 `/admin/order`

#### GET `/admin/order/conditionSearch` — 订单搜索

**请求参数** (Query):
```
page=1&pageSize=10&number=20240101001&phone=138xxxx&status=2&beginTime=2024-01-01&endTime=2024-01-31
```

**响应 JSON** (`Result<PageResult>`): `records` 元素为 `OrderVO`，结构见下方详情接口。

---

#### GET `/admin/order/statistics` — 订单状态统计

**响应 JSON** (`Result<OrderStatisticsVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "toBeConfirmed": 5,        // Integer: 待接单
    "confirmed": 3,            // Integer: 待派送
    "deliveryInProgress": 2    // Integer: 派送中
  }
}
```

---

#### GET `/admin/order/details/{id}` — 订单详情

**响应 JSON** (`Result<OrderVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "id": 100,
    "number": "20240101000001",
    "status": 2,
    "userId": 5,
    "addressBookId": 3,
    "orderTime": "2024-01-01T10:00:00",
    "checkoutTime": "2024-01-01T10:05:00",
    "payMethod": 1,
    "payStatus": 1,
    "amount": 88.00,
    "remark": "少辣",
    "phone": "13800138000",
    "address": "北京市朝阳区xxx路xxx号",
    "consignee": "张三",
    "cancelReason": null,
    "rejectionReason": null,
    "cancelTime": null,
    "estimatedDeliveryTime": "2024-01-01T10:30:00",
    "deliveryStatus": 1,
    "deliveryTime": null,
    "packAmount": 2,
    "tablewareNumber": 1,
    "tablewareStatus": 1,
    "userName": "微信用户",
    "orderDishes": "宫保鸡丁,酸辣汤",
    "orderDetailList": [
      {
        "id": 1,
        "name": "宫保鸡丁",
        "orderId": 100,
        "dishId": 1,
        "setmealId": null,
        "dishFlavor": "微辣",
        "number": 1,
        "amount": 28.00,
        "image": "http://xxx.jpg"
      },
      {
        "id": 2,
        "name": "酸辣汤",
        "orderId": 100,
        "dishId": 2,
        "setmealId": null,
        "dishFlavor": "中辣",
        "number": 2,
        "amount": 36.00,
        "image": "http://xxx.jpg"
      }
    ]
  }
}
```

> **状态枚举**: `status`: 1=待付款, 2=待接单, 3=已接单, 4=派送中, 5=已完成, 6=已取消
> `payMethod`: 1=微信, 2=支付宝
> `payStatus`: 0=未支付, 1=已支付, 2=退款

---

#### PUT `/admin/order/confirm` — 接单

**请求体**:
```json
{ "id": 100 }
```

**响应 JSON**: `Result`, `data` 为 null。

---

#### PUT `/admin/order/rejection` — 拒单

**请求体**:
```json
{
  "id": 100,
  "rejectionReason": "库存不足"
}
```

**响应 JSON**: `Result`, `data` 为 null。

---

#### PUT `/admin/order/cancel` — 取消订单

**请求体**:
```json
{
  "id": 100,
  "cancelReason": "用户要求取消"
}
```

**响应 JSON**: `Result`, `data` 为 null。

---

#### PUT `/admin/order/delivery/{id}` — 派送订单

**响应 JSON**: `Result`, `data` 为 null。

---

#### PUT `/admin/order/complete/{id}` — 完成订单

**响应 JSON**: `Result`, `data` 为 null。

---

### 2.6 ShopController — 店铺设置 `/admin/shop`

#### PUT `/admin/shop/{status}` — 设置营业状态

**请求参数**: Path `status` = 1(营业中)/0(打烊)

**响应 JSON** (`Result`):
```json
{ "code": 1, "msg": null, "data": null }
```

---

#### GET `/admin/shop/status` — 获取营业状态

**响应 JSON** (`Result<Integer>`):
```json
{
  "code": 1,
  "msg": null,
  "data": 1     // Integer: 1=营业中, 0=打烊
}
```

---

### 2.7 CommonController — 通用接口 `/admin/common`

#### POST `/admin/common/upload` — 文件上传

**请求**: `multipart/form-data`, 字段名 `file`

**响应 JSON** (`Result<String>`):
```json
{
  "code": 1,
  "msg": null,
  "data": "http://oss.aliyun.com/xxx/abc.jpg"   // String: 上传后的文件URL
}
```

---

### 2.8 ReportController — 数据统计 `/admin/report`

#### GET `/admin/report/turnoverStatistics` — 营业额统计

**请求参数**: `begin=2024-01-01&end=2024-01-31`

**响应 JSON** (`Result<TurnoverReportVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "dateList": "2024-01-01,2024-01-02,2024-01-03",
    "turnoverList": "2580.00,3200.00,1890.50"
  }
}
```
> `dateList` / `turnoverList`: 逗号分隔字符串，前端需 `split(",")` 后配合 ECharts 使用。

---

#### GET `/admin/report/userStatistics` — 用户统计

**请求参数**: `begin=2024-01-01&end=2024-01-31`

**响应 JSON** (`Result<UserReportVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "dateList": "2024-01-01,2024-01-02,2024-01-03",
    "totalUserList": "100,105,112",
    "newUserList": "10,5,7"
  }
}
```

---

#### GET `/admin/report/ordersStatistics` — 订单统计

**请求参数**: `begin=2024-01-01&end=2024-01-31`

**响应 JSON** (`Result<OrderReportVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "dateList": "2024-01-01,2024-01-02,2024-01-03",
    "orderCountList": "20,25,18",
    "validOrderCountList": "18,22,16",
    "totalOrderCount": 63,
    "validOrderCount": 56,
    "orderCompletionRate": 0.89
  }
}
```

---

#### GET `/admin/report/top10` — 销量排名Top10

**请求参数**: `begin=2024-01-01&end=2024-01-31`

**响应 JSON** (`Result<SalesTop10ReportVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "nameList": "宫保鸡丁,鱼香肉丝,酸辣汤,麻婆豆腐,...",
    "numberList": "120,105,98,85,..."
  }
}
```

---

#### GET `/admin/report/export` — 导出运营数据Excel

**请求参数**: 无 (后端直接从数据库取近30天数据)

**响应**: `Content-Type: application/vnd.ms-excel` 直接输出二进制流，前端用 `Blob` 下载。

---

### 2.9 WorkSpaceController — 工作台 `/admin/workspace`

#### GET `/admin/workspace/businessData` — 今日运营数据

**响应 JSON** (`Result<BusinessDataVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "turnover": 2580.00,           // Double: 营业额
    "validOrderCount": 18,         // Integer: 有效订单数
    "orderCompletionRate": 0.89,   // Double: 订单完成率
    "unitPrice": 143.33,           // Double: 平均客单价
    "newUsers": 5                  // Integer: 新增用户数
  }
}
```

---

#### GET `/admin/workspace/overviewOrders` — 订单概览

**响应 JSON** (`Result<OrderOverViewVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "waitingOrders": 5,
    "deliveredOrders": 3,
    "completedOrders": 20,
    "cancelledOrders": 2,
    "allOrders": 30
  }
}
```

---

#### GET `/admin/workspace/overviewDishes` — 菜品总览

**响应 JSON** (`Result<DishOverViewVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "sold": 45,           // Integer: 已启售
    "discontinued": 10    // Integer: 已停售
  }
}
```

---

#### GET `/admin/workspace/overviewSetmeals` — 套餐总览

**响应 JSON** (`Result<SetmealOverViewVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "sold": 15,           // Integer: 已启售
    "discontinued": 3     // Integer: 已停售
  }
}
```

---

### 2.10 AiAdminController — 管理端AI智能 `/admin/ai`

#### GET `/admin/ai/sales-analysis` — AI销售分析报告

**请求参数**: Query `days` (默认7)

**响应 JSON** (`Result<AiSalesAnalysisVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "period": "2024-01-01 至 2024-01-07",
    "summary": "整体销售额呈上升趋势...",
    "highlights": [
      "宫保鸡丁连续7天销量第一",
      "套餐类销售额同比增长15%"
    ],
    "warnings": [
      "酸辣汤销量连续3天下滑",
      "午高峰订单积压率上升5%"
    ],
    "suggestions": [
      "加大宫保鸡丁备货量",
      "推出酸辣汤限时促销"
    ],
    "trendDescription": "销售额整体稳定，周三为高峰"
  }
}
```

---

#### GET `/admin/ai/menu-suggestion` — AI菜单优化建议

**响应 JSON** (`Result<AiMenuSuggestionVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "promoteList": ["宫保鸡丁", "鱼香肉丝", "酸辣汤"],
    "demoteList": ["凉拌黄瓜"],
    "newCategoryIdeas": ["低卡轻食", "时令鲜品"],
    "summary": "建议将宫保鸡丁设为首页推荐..."
  }
}
```

---

#### POST `/admin/ai/dish-description` — AI生成菜品描述

**请求体**:
```json
{
  "dishName": "宫保鸡丁",
  "ingredients": "鸡胸肉,花生,干辣椒,黄瓜,胡萝卜"
}
```

**响应 JSON** (`Result<List<String>>`):
```json
{
  "code": 1,
  "msg": null,
  "data": [
    "宫保鸡丁是一道闻名中外的经典川菜，选用鲜嫩鸡胸肉搭配香脆花生米...",
    "鲜香微辣，花生酥脆，鸡肉嫩滑，是下饭首选！"
  ]
}
```

---

## 三、用户端接口 (User) — 8 个 Controller，30 个端点

### 3.1 UserController — C端用户 `/user/user`

#### POST `/user/user/login` — 微信用户登录

**请求体**:
```json
{
  "code": "081xxxx"    // String: 微信登录code
}
```

**响应 JSON** (`Result<UserLoginVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "id": 5,
    "userName": "wx_user_xxx",
    "name": "微信用户",
    "token": "eyJhbG..."
  }
}
```

---

### 3.2 CategoryController — C端分类 `/user/category`

#### GET `/user/category/list` — 查询分类列表

**请求参数**: Query `type` (1=菜品分类, 2=套餐分类)

**响应 JSON** (`Result<List<Category>>`):
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "id": 1,
      "type": 1,
      "name": "热门菜品",
      "sort": 1,
      "status": 1,
      "createTime": "2024-01-01T10:00:00",
      "updateTime": "2024-01-01T10:00:00",
      "createUser": 1,
      "updateUser": 1
    }
  ]
}
```

---

### 3.3 DishController — C端菜品浏览 `/user/dish`

#### GET `/user/dish/list` — 根据分类ID查询菜品

**请求参数**: Query `categoryId`

**响应 JSON** (`Result<List<DishVO>>`):
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "id": 1,
      "name": "宫保鸡丁",
      "categoryId": 1,
      "price": 28.00,
      "image": "http://xxx.jpg",
      "description": "经典川菜，鲜香微辣",
      "status": 1,
      "updateTime": "2024-01-01T10:00:00",
      "categoryName": "热门菜品",
      "flavors": [
        { "id": 1, "dishId": 1, "name": "辣度", "value": "[\"微辣\",\"中辣\",\"重辣\"]" }
      ]
    }
  ]
}
```
> 注意：只有状态为「起售」(status=1)的菜品才会返回给用户端。

---

### 3.4 SetmealController — C端套餐浏览 `/user/setmeal`

#### GET `/user/setmeal/list` — 根据分类ID查询套餐

**请求参数**: Query `categoryId`

**响应 JSON** (`Result<List<Setmeal>>`):
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "id": 1,
      "categoryId": 2,
      "name": "双人优惠套餐",
      "price": 68.00,
      "status": 1,
      "description": "超值双人餐",
      "image": "http://xxx.jpg",
      "createTime": "2024-01-01T10:00:00",
      "updateTime": "2024-01-01T10:00:00",
      "createUser": 1,
      "updateUser": 1
    }
  ]
}
```

---

#### GET `/user/setmeal/dish/{id}` — 套餐包含的菜品列表

**响应 JSON** (`Result<List<DishItemVO>>`):
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "name": "宫保鸡丁",
      "copies": 1,
      "image": "http://xxx.jpg",
      "description": "经典川菜"
    },
    {
      "name": "酸辣汤",
      "copies": 2,
      "image": "http://xxx.jpg",
      "description": "开胃汤品"
    }
  ]
}
```

---

### 3.5 ShoppingCartController — 购物车 `/user/shoppingCart`

#### POST `/user/shoppingCart/add` — 添加到购物车

**请求体**:
```json
{
  "dishId": 1,           // Long: 菜品ID (菜品和套餐二选一)
  "setmealId": null,     // Long: 套餐ID
  "dishFlavor": "微辣"    // String: 口味选择
}
```

**响应 JSON** (`Result`):
```json
{ "code": 1, "msg": null, "data": null }
```

---

#### GET `/user/shoppingCart/list` — 查看购物车

**响应 JSON** (`Result<List<ShoppingCart>>`):
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "id": 10,
      "name": "宫保鸡丁",
      "userId": 5,
      "dishId": 1,
      "setmealId": null,
      "dishFlavor": "微辣",
      "number": 2,
      "amount": 56.00,
      "image": "http://xxx.jpg",
      "createTime": "2024-01-01T10:00:00"
    },
    {
      "id": 11,
      "name": "双人优惠套餐",
      "userId": 5,
      "dishId": null,
      "setmealId": 1,
      "dishFlavor": null,
      "number": 1,
      "amount": 68.00,
      "image": "http://xxx.jpg",
      "createTime": "2024-01-01T10:01:00"
    }
  ]
}
```

---

#### DELETE `/user/shoppingCart/clean` — 清空购物车

**响应 JSON**: `Result`, `data` 为 null。

---

#### POST `/user/shoppingCart/sub` — 减少一个商品

**请求体** 同 `add`（传入 `dishId` 或 `setmealId`）。

**响应 JSON**: `Result`, `data` 为 null。

---

### 3.6 AddressBookController — 地址簿 `/user/addressBook`

#### GET `/user/addressBook/list` — 查询所有地址

**响应 JSON** (`Result<List<AddressBook>>`):
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "id": 1,
      "userId": 5,
      "consignee": "张三",
      "sex": "1",
      "phone": "13800138000",
      "provinceCode": "110000",
      "provinceName": "北京市",
      "cityCode": "110100",
      "cityName": "北京市",
      "districtCode": "110105",
      "districtName": "朝阳区",
      "detail": "xxx路xxx号",
      "label": "公司",
      "isDefault": 1
    }
  ]
}
```

---

#### POST `/user/addressBook` — 新增地址

**请求体**: 同上述 AddressBook 结构，不带 `id`。

**响应 JSON**: `Result`, `data` 为 null。

---

#### GET `/user/addressBook/{id}` — 根据ID查询地址

**响应 JSON** (`Result<AddressBook>`): 同上单个地址对象。

---

#### PUT `/user/addressBook` — 修改地址

**请求体**: 同 AddressBook 结构，带 `id`。

**响应 JSON**: `Result`, `data` 为 null。

---

#### PUT `/user/addressBook/default` — 设置默认地址

**请求体**:
```json
{ "id": 1 }
```

**响应 JSON**: `Result`, `data` 为 null。

---

#### DELETE `/user/addressBook` — 删除地址

**请求参数**: Query `id`

**响应 JSON**: `Result`, `data` 为 null。

---

#### GET `/user/addressBook/default` — 查询默认地址

**响应 JSON** (`Result<AddressBook>`): 同单个地址对象。

---

### 3.7 OrderController — C端订单 `/user/order`

#### POST `/user/order/submit` — 提交订单

**请求体**:
```json
{
  "addressBookId": 1,
  "payMethod": 1,
  "remark": "少辣",
  "estimatedDeliveryTime": "2024-01-01T10:30:00",
  "deliveryStatus": 1,
  "tablewareNumber": 1,
  "tablewareStatus": 1,
  "packAmount": 2,
  "amount": 88.00
}
```

**响应 JSON** (`Result<OrderSubmitVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "id": 100,
    "orderNumber": "20240101000001",
    "orderAmount": 88.00,
    "orderTime": "2024-01-01T10:00:00"
  }
}
```

---

#### PUT `/user/order/payment` — 订单支付

**请求体**:
```json
{
  "orderNumber": "20240101000001",
  "payMethod": 1
}
```

**响应 JSON** (`Result<OrderPaymentVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "nonceStr": "abc123...",
    "paySign": "sign...",
    "timeStamp": "1704096000",
    "signType": "MD5",
    "packageStr": "prepay_id=wx..."
  }
}
```
> 这是微信JSAPI支付的参数，前端调用 `wx.chooseWXPay()` 时使用。

---

#### GET `/user/order/historyOrders` — 历史订单分页

**请求参数**: `page`, `pageSize`, `status` (可选，1-6)

**响应 JSON** (`Result<PageResult>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 5,
    "records": [
      {
        "id": 100,
        "number": "20240101000001",
        "status": 2,
        "userId": 5,
        "orderTime": "2024-01-01T10:00:00",
        "payMethod": 1,
        "payStatus": 1,
        "amount": 88.00,
        "remark": "少辣",
        "phone": "13800138000",
        "address": "北京市朝阳区xxx路xxx号",
        "consignee": "张三",
        "estimatedDeliveryTime": "2024-01-01T10:30:00",
        "deliveryStatus": 1,
        "packAmount": 2,
        "tablewareNumber": 1,
        "tablewareStatus": 1,
        "userName": "微信用户",
        "orderDishes": "宫保鸡丁,酸辣汤",
        "orderDetailList": [ ... ]
      }
    ]
  }
}
```
> 每条记录结构与管理端 `OrderVO` 一致（见 2.5 节详情接口）。

---

#### GET `/user/order/orderDetail/{id}` — 查询订单详情

**响应 JSON** (`Result<OrderVO>`): 结构与 [2.5 订单详情](#get-adminorderdetailsid--订单详情) 完全一致。

---

#### PUT `/user/order/cancel/{id}` — 取消订单

**请求参数**: Path `id` = 订单ID

**响应 JSON**: `Result`, `data` 为 null。

---

#### POST `/user/order/repetition/{id}` — 再来一单

**请求参数**: Path `id` = 订单ID

**响应 JSON**: `Result`, `data` 为 null (后端自动将订单菜品重新加入购物车)。

---

#### GET `/user/order/reminder/{id}` — 催单

**请求参数**: Path `id` = 订单ID

**响应 JSON**: `Result`, `data` 为 null。

---

### 3.8 ShopController — C端店铺 `/user/shop`

#### GET `/user/shop/status` — 获取营业状态

**响应 JSON** (`Result<Integer>`):
```json
{
  "code": 1,
  "msg": null,
  "data": 1
}
```
> `data`: 1=营业中, 0=已打烊

---

### 3.9 AiController — C端AI智能 `/user/ai`

#### POST `/user/ai/recommend` — AI智能推荐

**请求**: 无请求体（从Token获取userId，基于用户历史订单推荐）

**响应 JSON** (`Result<List<AiRecommendVO>>`):
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "dishId": 1,
      "dishName": "宫保鸡丁",
      "image": "http://xxx.jpg",
      "price": 28.00,
      "reason": "您上次点过，好评率99%",
      "categoryName": "热门菜品"
    },
    {
      "dishId": 3,
      "dishName": "鱼香肉丝",
      "image": "http://xxx.jpg",
      "price": 32.00,
      "reason": "本周热销Top3",
      "categoryName": "热门菜品"
    }
  ]
}
```

---

#### GET `/user/ai/daily` — 今日AI推荐

**响应 JSON** (`Result<AiDailyVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "date": "2024-01-01",
    "slogan": "今日推荐：温暖你的胃",
    "recommendations": [
      {
        "dishId": 1,
        "dishName": "宫保鸡丁",
        "image": "http://xxx.jpg",
        "price": 28.00,
        "reason": "今日热销",
        "categoryName": "热门菜品"
      }
    ]
  }
}
```

---

#### POST `/user/ai/chat` — AI点餐助手对话

**请求体**:
```json
{
  "message": "帮我推荐一个两人份的套餐"   // String
}
```

**响应 JSON** (`Result<AiChatVO>`):
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "reply": "为您推荐以下搭配：\n1. 双人优惠套餐 68元 - 包含宫保鸡丁+酸辣汤\n2. 情侣套餐 88元 - 包含鱼香肉丝+蛋花汤+米饭\n\n推荐理由：性价比高，好评率95%以上",
    "suggestedDishIds": [1, 3],
    "suggestedDishNames": ["双人优惠套餐", "情侣套餐"]
  }
}
```

---

## 四、接口统计一览

| 维度 | 数量 |
|------|------|
| 控制器总数 | 18 |
| API端点总数 | 73 |
| GET 端点 | 39 |
| POST 端点 | 19 |
| PUT 端点 | 11 |
| DELETE 端点 | 4 |
| 管理端端点 | 43 |
| 用户端端点 | 30 |

---

## 五、前端设计建议

### 5.1 技术栈推荐

| 层级 | 推荐方案 | 备选方案 |
|------|----------|----------|
| 管理端框架 | Vue 3 + Element Plus | React + Ant Design |
| 用户端框架 | Vue 3 + Vant UI（移动端H5） | 微信小程序原生 / UniApp |
| 状态管理 | Pinia | Vuex |
| HTTP客户端 | Axios（封装拦截器统一处理Token和错误） | — |
| 图表库 | ECharts 5（管理端报表） | — |
| 构建工具 | Vite | — |

---

### 5.2 管理端 (Admin) 设计建议

#### 5.2.1 整体布局

```
┌──────────────────────────────────────────────┐
│  Logo / 系统名称          [通知] [头像 ▼]    │  ← 顶栏 Header
├─────────┬────────────────────────────────────┤
│  📊 工作台 │                                    │
│  👥 员工管理│                                    │
│  📂 分类管理│        主内容区                    │  ← Sider + Content
│  🍜 菜品管理│    (Router View)                  │
│  📦 套餐管理│                                    │
│  📋 订单管理│                                    │
│  🏪 店铺设置│                                    │
│  📈 数据统计│                                    │
│  🤖 AI助手  │                                    │
└─────────┴────────────────────────────────────┘
```

**建议菜单结构**：

| 一级菜单 | 二级菜单 / 功能 | 对应API |
|----------|----------------|---------|
| **工作台** | 今日数据概览、订单/菜品/套餐总览 | `workspace/*` |
| **员工管理** | 员工列表(CRUD+分页)、启用/禁用 | `employee/*` |
| **分类管理** | 分类列表、增删改查、启停 | `category/*` |
| **菜品管理** | 菜品列表、新增/编辑(含图片上传)、批量删除、起售停售 | `dish/*` + `common/upload` |
| **套餐管理** | 套餐列表、新增/编辑(关联菜品)、批量删除、起售停售 | `setmeal/*` |
| **订单管理** | 订单搜索/筛选、详情、接单/拒单/派送/完成 | `order/*` |
| **店铺设置** | 营业状态开关 | `shop/*` |
| **数据统计** | 营业额/用户/订单统计图表、销量Top10、导出报表 | `report/*` |
| **AI助手** | 销售分析报告、菜单优化建议、AI生成菜品描述 | `ai/*` |

#### 5.2.2 关键页面设计要点

**1. 工作台 (Dashboard)**
- 顶部：4 个数字卡片 —— 今日营业额、订单数、新增用户、平均客单价
  - 数据来源: [`businessData`](#get-adminworkspacebusinessdata--今日运营数据)
- 中部：订单状态概览卡片 —— 待接单/待派送/已完成/已取消
  - 数据来源: [`overviewOrders`](#get-adminworkspaceovervieworders--订单概览)
- 底部：菜品/套餐启售停售统计
  - 数据来源: [`overviewDishes`](#get-adminworkspaceoverviewdishes--菜品总览) + [`overviewSetmeals`](#get-adminworkspaceoverviewsetmeals--套餐总览)

**2. 菜品管理**
- 表格列：图片缩略图、名称、分类、价格、状态（启售/停售标签）、操作（编辑/删除/切换状态）
- 新增/编辑使用 Dialog 弹窗，包含图片上传组件（调用 [`common/upload`](#post-admincommonupload--文件上传)，返回URL后预览）
- 支持批量勾选删除
- AI按钮：选中菜品后可调用 [`ai/dish-description`](#post-adminaidish-description--ai生成菜品描述) 自动生成菜品描述文案

**3. 订单管理**
- 顶部状态Tab切换：全部 / 待接单 / 已接单 / 派送中 / 已完成 / 已取消
- 表格支持按单号、手机号、时间范围搜索
- 操作列根据订单状态动态显示：
  - 待接单(status=2) →「接单」「拒单」
  - 已接单(status=3) →「派送」
  - 派送中(status=4) →「完成」
- 拒单和取消需填写原因（弹窗）

**4. 数据统计**
- 日期范围选择器 + 查询按钮
- 折线图展示营业额/订单数/新增用户趋势：`split(",")` 解析 `dateList` / `turnoverList` / `orderCountList` 等逗号分隔字符串
- 横向柱状图展示销量Top10
- 「导出报表」按钮 → 调用 [`report/export`](#get-adminreportexport--导出运营数据excel)，用 Blob 下载

**5. AI 助手**
- 「销售分析」卡片 —— 选择天数，点击生成分析报告（Markdown渲染）
- 「菜单优化」卡片 —— 一键生成优化建议
- 「菜品描述生成」卡片 —— 输入菜品名/食材，AI生成多段描述文案

#### 5.2.3 通用设计要点
- **Token管理**：Axios 拦截器自动在请求头携带 `token` (管理端从 `login` 响应的 `data.token` 获取)，401时跳转登录页
- **权限控制**：仅员工管理页面需要管理员权限，其他页面登录员工均可访问
- **图片上传**：统一使用 `POST /admin/common/upload`，返回URL后预览
- **表单校验**：手机号、价格、非空等前端+后端双重校验

---

### 5.3 用户端 (User) 设计建议

#### 5.3.1 页面结构（移动端 H5 / 小程序）

```
TabBar 导航：
  🏠 首页  ─  点单  ─  🛒 购物车  ─  📋 订单  ─  👤 我的
```

#### 5.3.2 各页面设计

**1. 首页**
- 顶部：店铺状态横幅（营业中/已打烊 ——调用 `shop/status`，`data`=1 显示营业中）
- 搜索栏（菜品/套餐名称搜索，前端本地过滤）
- Banner轮播图（可后台配置）
- 「今日AI推荐」卡片 —— 调用 `ai/daily`，展示 `data.slogan` + `data.recommendations[]` 的菜品卡片
- 分类快捷入口（热销、新品、优惠等）

**2. 点单页**
- 左侧：分类竖列（从 `category/list` 获取 `data[]`）
- 右侧：该分类下的菜品 + 套餐列表（调用 `dish/list` + `setmeal/list`）
- 菜品返回 `Result<List<DishVO>>`，每条含 `flavors` 可选规格
- 套餐返回 `Result<List<Setmeal>>`，点击可查看包含菜品 → 调用 `setmeal/dish/{id}` 返回 `Result<List<DishItemVO>>`
- 点击菜品弹出详情浮层（图片、描述、价格）
- 支持选择规格/口味 → 加入购物车按钮 → 调用 `shoppingCart/add`
- 底部悬浮：购物车数量角标 + 「去结算」按钮

**3. 购物车**
- 列表展示已选商品（调用 `shoppingCart/list` 返回 `Result<List<ShoppingCart>>`，含 `name`, `number`, `amount`, `image`）
- 支持 + / - 增减数量（`shoppingCart/add` / `shoppingCart/sub`）
- 支持一键「清空购物车」→ `shoppingCart/clean`
- 底部总价汇总 + 「去结算」按钮

**4. 下单结算**
- 选择/新增收货地址 → 调用 `addressBook/*` 系列接口
- 确认订单商品清单
- 备注输入框
- 「提交订单」按钮 → 调用 `order/submit`，响应返回 `OrderSubmitVO`（含 `orderNumber`, `orderAmount`）
- 支付页面 → 调用 `order/payment`，响应返回微信支付参数 `OrderPaymentVO`（含 `nonceStr`, `paySign`, `timeStamp`, `packageStr`）
- AI对话悬浮球：用户可以说"帮我推荐一个两人份的套餐"等 → 调用 `ai/chat`，响应 `AiChatVO`（含 `reply` 文本 + `suggestedDishIds` / `suggestedDishNames`）

**5. 订单列表**
- Tab切换：全部 / 待付款 / 待接单 / 派送中 / 已完成 / 已取消（对应 `status` 1-6）
- 调用 `order/historyOrders`，传 `page`, `pageSize`, `status`，返回 `Result<PageResult>`，每条为 `OrderVO`
- 订单卡片展示：下单时间、商品摘要(`orderDishes`)、金额(`amount`)、状态
- 各状态操作按钮：
  - 待付款(status=1) →「去支付」「取消」
  - 待接单(status=2) →「催单」「取消」
  - 派送中(status=4) →「催单」
  - 已完成(status=5) →「再来一单」(调用 `order/repetition/{id}`)

**6. 我的**
- 用户头像/昵称
- 地址管理入口
- 我的收藏（后续扩展）
- 客服入口
- AI点餐助手入口

#### 5.3.3 AI 点餐助手设计

```
┌──────────────────────────┐
│  🤖 AI美食助手            │
│                          │
│  ┌──────────────────────┐│
│  │ 推荐今日热销菜品      ││
│  │ 帮我搭配一个双人套餐  ││  ← 快捷提示词卡片
│  │ 有什么清淡的菜品？    ││
│  └──────────────────────┘│
│                          │
│  👤 我想吃辣的           │
│  🤖 为您推荐：           │
│    1. 麻辣香锅 ¥38      │
│    2. 水煮鱼 ¥42        │
│    3. 辣子鸡 ¥35        │  ← 对话流
│    点击可快速加入购物车   │
│                          │
│  [输入框____________] [发送]│
└──────────────────────────┘
```

- 从首页AI推荐卡片或「我的」页面进入
- 对话流展示，后端调用 `ai/chat`，响应 `AiChatVO.reply`（支持 Markdown 渲染）
- 推荐菜品卡片支持一键「加入购物车」（使用 `suggestedDishIds`）

#### 5.3.4 通用设计要点
- 微信授权登录流程（调用 `user/login`，传入微信 `code`，获取 `token` 存储）
- Token 过期自动刷新或重新登录
- 所有请求通过 Axios 拦截器在 Header 中自动携带 `token`
- 离线提示 & 弱网优化（Toast提示）
- 骨架屏加载态（列表、详情）
- 适配 iPhone 底部安全区（Safe Area）

---

### 5.4 项目结构建议（前端多模块）

```
sky-take-out-frontend/
├── admin-web/                  # 管理端 (Vue3 + Element Plus)
│   ├── src/
│   │   ├── api/                # 接口封装（按模块拆分）
│   │   │   ├── employee.js
│   │   │   ├── category.js
│   │   │   ├── dish.js
│   │   │   ├── setmeal.js
│   │   │   ├── order.js
│   │   │   ├── shop.js
│   │   │   ├── common.js
│   │   │   ├── report.js
│   │   │   ├── workspace.js
│   │   │   └── ai.js
│   │   ├── views/              # 页面组件
│   │   ├── components/         # 公共组件
│   │   ├── router/             # 路由配置
│   │   ├── stores/             # Pinia 状态管理
│   │   ├── utils/              # 工具函数 (request.js axios封装)
│   │   └── assets/             # 静态资源
│   └── package.json
│
├── user-h5/                    # 用户端 (Vue3 + Vant UI, H5)
│   ├── src/
│   │   ├── api/
│   │   │   ├── user.js
│   │   │   ├── category.js
│   │   │   ├── dish.js
│   │   │   ├── setmeal.js
│   │   │   ├── cart.js
│   │   │   ├── address.js
│   │   │   ├── order.js
│   │   │   └── ai.js
│   │   ├── views/
│   │   ├── components/
│   │   ├── router/
│   │   ├── stores/
│   │   └── utils/
│   └── package.json
│
└── shared/                     # 共享类型定义/常量
    └── types/
```

---

### 5.5 优先级建议

| 优先级 | 模块 | 说明 |
|--------|------|------|
| P0 | 用户端首页、点单、购物车、下单 | 核心交易闭环 |
| P0 | 管理端登录、订单管理 | 运营必备 |
| P1 | 用户端订单列表、地址管理、AI推荐 | 用户体验 |
| P1 | 管理端菜品/套餐/分类管理 | 内容管理 |
| P2 | 用户端AI点餐助手对话 | 差异化亮点 |
| P2 | 管理端工作台、数据统计、AI分析 | 数据驱动运营 |
| P3 | 管理端员工管理、店铺设置 | 基础配置 |
| P3 | 用户端催单、再来一单 | 体验细节 |

---

## 六、实施计划

1. **搭建前端项目骨架**：分别初始化 `admin-web` (Vue3 + Element Plus) 和 `user-h5` (Vue3 + Vant) 项目，配置 Vite、路由、Axios 封装（拦截器处理 `Result` 统一响应格式）
2. **Axios封装要点**：
   - 响应拦截器检查 `res.data.code === 1`，不为1则 `Message.error(res.data.msg)`
   - 请求拦截器自动从 `localStorage` 读取 `token` 注入 Header
   - 管理端 Header 名: `token`，值为登录返回的 `data.token`
   - 用户端 Header 名: `token`，值为登录返回的 `data.token`
3. **管理端开发**：按 P0 → P1 → P2 → P3 顺序开发各页面
4. **用户端开发**：按 P0 → P1 → P2 → P3 顺序开发各页面
5. **联调测试**：前后端对接，确保所有 73 个接口调通
6. **AI功能打磨**：优化AI对话体验、报告展示Markdown渲染