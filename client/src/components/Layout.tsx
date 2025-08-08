import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Car, Calendar, FileText, BarChart3, Users, LogOut, User as UserIcon, Truck, ChevronDown, Settings, TestTube } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth() as { user?: any };
  const [showManagementDropdown, setShowManagementDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowManagementDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const mainNavItems = [
    { 
      path: user?.role === 'user' ? '/booking' : '/applications', 
      label: user?.role === 'user' ? 'Permohonan' : 'Aplikasi', 
      icon: FileText,
      roles: ['user', 'admin', 'superadmin']
    },
    { 
      path: '/status', 
      label: 'Status Tempahan', 
      icon: FileText,
      roles: ['user']
    },
    { 
      path: '/calendar', 
      label: 'Kalendar', 
      icon: Calendar,
      roles: ['user', 'admin', 'superadmin']
    },
    { 
      path: '/reports', 
      label: 'Laporan', 
      icon: BarChart3,
      roles: ['admin', 'superadmin']
    },
  ];

  const managementItems = [
    { 
      path: '/users', 
      label: 'Pengguna', 
      icon: Users,
      roles: ['admin', 'superadmin']
    },
    { 
      path: '/drivers', 
      label: 'Pemandu', 
      icon: UserIcon,
      roles: ['admin', 'superadmin']
    },
    { 
      path: '/vehicles', 
      label: 'Kenderaan', 
      icon: Truck,
      roles: ['admin', 'superadmin']
    },
    { 
      path: '/role-testing', 
      label: 'Pengujian Peranan', 
      icon: TestTube,
      roles: ['user', 'admin', 'superadmin']
    },
  ];

  const visibleMainNavItems = mainNavItems.filter(item => 
    item.roles.includes(user?.role || 'user')
  );

  const visibleManagementItems = managementItems.filter(item => 
    item.roles.includes(user?.role || 'user')
  );

  const showManagementMenu = visibleManagementItems.length > 0;
  const isManagementActive = managementItems.some(item => location === item.path);

  return (
    <div className="min-h-screen bg-gov-gray">
      {/* Header */}
      <nav className="bg-gov-blue shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Car className="text-white text-2xl mr-3" />
                <span className="text-white text-lg font-semibold">
                  Sistem Tempahan Kenderaan
                </span>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {visibleMainNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} href={item.path}>
                      <a className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2",
                        location === item.path
                          ? "text-white bg-gov-dark"
                          : "text-blue-200 hover:text-white hover:bg-gov-dark"
                      )}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </a>
                    </Link>
                  );
                })}
                
                {showManagementMenu && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowManagementDropdown(!showManagementDropdown)}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2",
                        isManagementActive
                          ? "text-white bg-gov-dark"
                          : "text-blue-200 hover:text-white hover:bg-gov-dark"
                      )}
                    >
                      <Settings className="h-4 w-4" />
                      Pengurusan
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    
                    {showManagementDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          {visibleManagementItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link key={item.path} href={item.path}>
                                <a 
                                  onClick={() => setShowManagementDropdown(false)}
                                  className={cn(
                                    "flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100",
                                    location === item.path
                                      ? "text-gov-blue font-medium bg-blue-50"
                                      : "text-gray-700"
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                  {item.label}
                                </a>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-white text-sm">
                <span>{user?.firstName || ''} {user?.lastName || ''}</span>
                <span className="text-blue-200 ml-2">
                  | {user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Pengguna'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-blue-200 hover:text-white hover:bg-gov-dark"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
        )}
        {children}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2025 Jabatan Akauntan Negara Malaysia, Negeri Sembilan. Hak Cipta Terpelihara.
            </div>
            <div className="text-sm text-gray-500">
              Sistem Tempahan Kenderaan v2.1.0
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
