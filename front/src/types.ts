export interface LoginResponse {
  id: number;
  userName: string;
  name: string;
  token: string;
}

export interface Result<T> {
  code: number;
  msg: string | null;
  data: T;
}

export interface PageResult<T> {
  total: number;
  records: T[];
}

export interface Employee {
  id: number;
  username: string;
  name: string;
  phone: string;
  sex: string;
  idNumber: string;
  status: number;
  createTime: string;
  updateTime: string;
}

export interface Category {
  id: number;
  type: number; // 1: Dish, 2: Setmeal
  name: string;
  sort: number;
  status: number;
}

export interface Dish {
  id: number;
  name: string;
  categoryId: number;
  categoryName?: string;
  price: number;
  image: string;
  description: string;
  status: number;
  flavors?: DishFlavor[];
}

export interface DishFlavor {
  id?: number;
  dishId?: number;
  name: string;
  value: string; // JSON string of options
}

export interface Order {
  id: number;
  number: string;
  status: number; // 1: Pending, 2: To be accepted, 3: Accepted, 4: Delivery, 5: Completed, 6: Cancelled
  userId: number;
  orderTime: string;
  amount: number;
  phone: string;
  address: string;
  consignee: string;
  orderDishes?: string;
  orderDetailList?: OrderDetail[];
}

export interface OrderDetail {
  id: number;
  name: string;
  image: string;
  dishId: number;
  setmealId: number | null;
  dishFlavor: string | null;
  number: number;
  amount: number;
}

export interface DishVO {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  image: string;
  description: string;
  status: number;
  categoryName?: string;
  flavors?: DishFlavor[];
}

export interface AddressBookItem {
  id?: number;
  consignee: string;
  phone: string;
  sex: string;
  provinceCode?: string;
  provinceName: string;
  cityCode?: string;
  cityName: string;
  districtCode?: string;
  districtName: string;
  detail: string;
  label: string;
  isDefault: number;
}

export interface SetmealVO {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  image: string;
  description: string;
  status: number;
  setmealDishes?: { dishId: number; name: string; copies: number }[];
}

export interface OrderStatisticsVO {
  confirmed: number;
  deliveryInProgress: number;
  toBeConfirmed: number;
}

export interface TurnoverReportVO {
  dateList: string[];
  turnoverList: string[];
}

export interface UserReportVO {
  dateList: string[];
  totalUserList: string[];
  newUserList: string[];
}

export interface OrderReportVO {
  dateList: string[];
  orderCountList: string[];
  validOrderCountList: string[];
}

export interface SalesTop10ReportVO {
  nameList: string[];
  numberList: string[];
}

export interface EmployeeVO {
    id: number;
    username: string;
    name: string;
    phone: string;
    sex: string;
    idNumber: string;
    status: number;
    createTime?: string;
  }

export interface BusinessData {
  turnover: number;
  validOrderCount: number;
  orderCompletionRate: number;
  unitPrice: number;
  newUsers: number;
}

export interface AiSalesAnalysis {
  period: string;
  summary: string;
  highlights: string[];
  warnings: string[];
  suggestions: string[];
  trendDescription: string;
}

export interface AiRecommendVO {
  dishId: number | null;
  dishName: string;
  image: string | null;
  price: number | null;
  reason: string;
  categoryName?: string;
}

export interface AiDailyVO {
  date: string;
  slogan: string;
  recommendations: AiRecommendVO[];
}

export interface AiChatVO {
  reply: string;
  suggestedDishIds: number[];
  suggestedDishNames: string[];
}

export interface AiMenuSuggestionVO {
  promoteList: string[];
  demoteList: string[];
  newCategoryIdeas: string[];
  summary: string;
}

export interface ShoppingCartItem {
  id?: number;
  name: string;
  userId?: number;
  dishId?: number | null;
  setmealId?: number | null;
  dishFlavor?: string | null;
  number: number;
  amount: number;
  image?: string | null;
  createTime?: string;
}

export interface OrderVO {
  id: number;
  number: string;
  status: number;
  userId: number;
  orderTime: string;
  amount: number;
  phone: string;
  address: string;
  consignee: string;
  orderDishes?: string;
  orderDetailList?: OrderDetail[];
  cancelReason?: string;
  deliveryTime?: string;
  payStatus?: number;
}

export const ORDER_STATUS: Record<number, string> = {
  1: '待付款',
  2: '待接单',
  3: '已接单',
  4: '派送中',
  5: '已完成',
  6: '已取消',
};

export interface OrderOverViewVO {
  waitingOrders: number;
  deliveredOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  allOrders: number;
}

export interface DishOverViewVO {
  sold: number;
  discontinued: number;
}

export interface SetmealOverViewVO {
  sold: number;
  discontinued: number;
}

export interface DishItemVO {
  name: string;
  copies: number;
  image: string;
  description: string;
}

export interface Setmeal {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  image: string;
  description: string;
  status: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
