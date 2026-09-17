import {
  Home,
  User2,
  ChevronUp,
  Projector,
  ChevronDown,
  Ticket,
  User,
  ShoppingCart,
  RotateCcw,
  Store,
  Box,
  Users,
  Percent,
  Image as ImageIcon,
  MessageSquare,
  Send,
  ListChevronsDownUp,
  NotebookPen,
  Truck,
  BarChart3,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useLogout, useMe } from "@/hooks/useAuth";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

const AppSidebar = () => {
  const { mutate: logout } = useLogout();
  const { data: user } = useMe();

  const isStaff = user?.role === "STAFF";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size={"lg"}>
              <Link to={"/"} className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
                  S
                </span>
                <span className="text-lg font-bold">Stravo</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/">
                    <Home />
                    <span>Trang chủ</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/statistics">
                    <BarChart3 />
                    <span>Thống kê</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/pos">
                    <Store />
                    <span>Bán hàng tại quầy</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/orders">
                    <ShoppingCart />
                    <span>Quản lý Hóa đơn</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/chat">
                    <MessageSquare />
                    <span>Hộp thư hỗ trợ</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Collapsible className="group/collapsible" defaultOpen={false}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center">
                <RotateCcw className="mr-2" />
                Đổi hàng
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="pl-4">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/returns">
                        <RotateCcw />
                        Đổi hàng lỗi
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/exchange-deliveries">
                        <Truck />
                        Giao hàng đổi
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        { }
        <Collapsible className="group/collapsible" defaultOpen={false}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center">
                <Box className="mr-2" />
                Sản phẩm
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="pl-4">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/products">
                        <NotebookPen />
                        Quản lý sản phẩm
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/products/variants">
                        <ListChevronsDownUp />
                        Quản lý biến thể sản phẩm
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/products/create">
                        <ListChevronsDownUp />
                        Thêm sản phẩm
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {!isStaff && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/reviews">
                          <MessageSquare />
                          Quản lý đánh giá
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible className="group/collapsible" defaultOpen={false}>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center">
                <Projector className="mr-2" />
                Phân loại sản phẩm
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="pl-4">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/categories">
                        <Projector />
                        Quản lý danh mục
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/brands">
                        <Projector />
                        Quản lý thương hiệu
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {!isStaff ? (
          <>
            <Collapsible className="group/collapsible" defaultOpen={false}>
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex items-center">
                    <Percent className="mr-2" />
                    Ưu đãi & Khuyến mãi
                    <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="pl-4">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link to="/promotions">
                            <Percent />
                            Quản lý khuyến mãi
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link to="/coupons">
                            <Ticket />
                            Quản lý mã giảm giá
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            <Collapsible className="group/collapsible" defaultOpen={false}>
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex items-center">
                    <Users className="mr-2" />
                    Khách hàng & Người dùng
                    <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="pl-4">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link to="/customers">
                            <Users />
                            Quản lý khách hàng
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link to="/users">
                            <User />
                            Quản lý nhân viên
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          </>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Khách hàng</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/customers">
                      <Users />
                      <span>Quản lý khách hàng</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!isStaff && (
          <div className="">
            <Collapsible className="group/collapsible" defaultOpen={false}>
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex items-center">
                    <ImageIcon className="mr-2" />
                    Truyền thông
                    <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="pl-4">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link to="/banners">
                            <ImageIcon />
                            Quản lý ảnh quảng cáo
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link to="/marketing-emails">
                            <Send />
                            Email tiếp thị
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          </div>
        )}
      </SidebarContent>

      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> {user?.fullName} <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <Link to={"/profile"}>
                  <DropdownMenuItem>Tài khoản</DropdownMenuItem>
                </Link>
                <DropdownMenuItem>Cài đặt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
