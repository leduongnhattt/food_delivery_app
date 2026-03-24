/**
 * JSON shapes for Nest `/api/menu-items` (aligned with Prisma + legacy Next responses).
 * `Price` may be string after JSON serialization of Decimal.
 */

export interface MenuItemsPaginationDto {
    page: number
    limit: number
    total: number
    totalPages: number
}

export interface MenuItemCategoryApi {
    CategoryID: string
    CategoryName: string
}

export interface MenuItemEnterpriseApi {
    EnterpriseID: string
    EnterpriseName: string
    Address: string
}

/** Menu row as returned inside list/detail includes (extra fields allowed). */
export type MenuItemMenuNestedApi = {
    enterprise: MenuItemEnterpriseApi
} & Record<string, string | number | boolean | null | undefined>

export interface MenuItemMenuFoodApi {
    FoodID: string
    MenuID: string
    menu: MenuItemMenuNestedApi
}

export interface MenuItemRecordApi {
    FoodID: string
    DishName: string
    Price: string | number
    Stock: number
    Description: string | null
    ImageURL: string | null
    FoodCategoryID: string
    EnterpriseID: string
    IsAvailable: boolean
    CreatedAt: string
    UpdatedAt: string | null
    foodCategory: MenuItemCategoryApi
    menuFoods: MenuItemMenuFoodApi[]
}

export interface MenuItemsListApiResponse {
    menuItems: MenuItemRecordApi[]
    pagination: MenuItemsPaginationDto
}

/** Legacy PUT response uses `menuFoods: true` without nested `menu`. */
export interface MenuFoodLinkOnlyApi {
    FoodID: string
    MenuID: string
}

export interface MenuItemAfterUpdateApi
    extends Omit<MenuItemRecordApi, 'menuFoods'> {
    menuFoods: MenuFoodLinkOnlyApi[]
}

export interface MenuItemDeleteApiResponse {
    message: string
}
