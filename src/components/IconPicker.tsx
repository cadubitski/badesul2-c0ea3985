import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Folder,
  Link2,
  BookOpen,
  HelpCircle,
  Bot,
  Monitor,
  Headphones,
  BarChart3,
  File,
  Settings,
  Home,
  User,
  Users,
  Mail,
  Phone,
  Calendar,
  Clock,
  Search,
  Star,
  Heart,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Bell,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  Minus,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Copy,
  Clipboard,
  Save,
  Share2,
  Globe,
  Map,
  MapPin,
  Camera,
  Image,
  Video,
  Music,
  Mic,
  Volume2,
  Play,
  Pause,
  Square,
  Circle,
  Triangle,
  Zap,
  Cloud,
  Sun,
  Moon,
  Database,
  Server,
  Cpu,
  Wifi,
  Bluetooth,
  Battery,
  Power,
  Terminal,
  Code,
  Package,
  FolderOpen,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FilePlus,
  FileMinus,
  FileCheck,
  FileX,
  Layers,
  Layout,
  Grid,
  List,
  Table,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Gift,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  DollarSign,
  Percent,
  Tag,
  Bookmark,
  Flag,
  MessageCircle,
  MessageSquare,
  Send,
  Inbox,
  Archive,
  Printer,
  Paperclip,
  Scissors,
  Feather,
  Pen,
  Pencil,
  Highlighter,
  type LucideIcon,
} from "lucide-react";

// Mapeamento de ícones disponíveis
const iconMap: Record<string, LucideIcon> = {
  "file-text": FileText,
  "folder": Folder,
  "link-2": Link2,
  "book-open": BookOpen,
  "help-circle": HelpCircle,
  "bot": Bot,
  "monitor": Monitor,
  "headphones": Headphones,
  "bar-chart-3": BarChart3,
  "file": File,
  "settings": Settings,
  "home": Home,
  "user": User,
  "users": Users,
  "mail": Mail,
  "phone": Phone,
  "calendar": Calendar,
  "clock": Clock,
  "search": Search,
  "star": Star,
  "heart": Heart,
  "check-circle": CheckCircle,
  "x-circle": XCircle,
  "alert-circle": AlertCircle,
  "info": Info,
  "bell": Bell,
  "lock": Lock,
  "unlock": Unlock,
  "eye": Eye,
  "eye-off": EyeOff,
  "download": Download,
  "upload": Upload,
  "trash-2": Trash2,
  "edit": Edit,
  "plus": Plus,
  "minus": Minus,
  "external-link": ExternalLink,
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  "chevron-up": ChevronUp,
  "chevron-left": ChevronLeft,
  "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft,
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  "refresh-cw": RefreshCw,
  "copy": Copy,
  "clipboard": Clipboard,
  "save": Save,
  "share-2": Share2,
  "globe": Globe,
  "map": Map,
  "map-pin": MapPin,
  "camera": Camera,
  "image": Image,
  "video": Video,
  "music": Music,
  "mic": Mic,
  "volume-2": Volume2,
  "play": Play,
  "pause": Pause,
  "square": Square,
  "circle": Circle,
  "triangle": Triangle,
  "zap": Zap,
  "cloud": Cloud,
  "sun": Sun,
  "moon": Moon,
  "database": Database,
  "server": Server,
  "cpu": Cpu,
  "wifi": Wifi,
  "bluetooth": Bluetooth,
  "battery": Battery,
  "power": Power,
  "terminal": Terminal,
  "code": Code,
  "package": Package,
  "folder-open": FolderOpen,
  "file-code": FileCode,
  "file-image": FileImage,
  "file-video": FileVideo,
  "file-audio": FileAudio,
  "file-archive": FileArchive,
  "file-plus": FilePlus,
  "file-minus": FileMinus,
  "file-check": FileCheck,
  "file-x": FileX,
  "layers": Layers,
  "layout": Layout,
  "grid": Grid,
  "list": List,
  "table": Table,
  "pie-chart": PieChart,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  "activity": Activity,
  "award": Award,
  "gift": Gift,
  "shopping-cart": ShoppingCart,
  "shopping-bag": ShoppingBag,
  "credit-card": CreditCard,
  "dollar-sign": DollarSign,
  "percent": Percent,
  "tag": Tag,
  "bookmark": Bookmark,
  "flag": Flag,
  "message-circle": MessageCircle,
  "message-square": MessageSquare,
  "send": Send,
  "inbox": Inbox,
  "archive": Archive,
  "printer": Printer,
  "paperclip": Paperclip,
  "scissors": Scissors,
  "feather": Feather,
  "pen": Pen,
  "pencil": Pencil,
  "highlighter": Highlighter,
};

// Exportar para usar em outros componentes
export const getIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || File;
};

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const iconNames = Object.keys(iconMap);
  const filteredIcons = iconNames.filter((name) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SelectedIcon = getIconComponent(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <SelectedIcon className="h-4 w-4" />
          <span className="flex-1 text-left">{value || "Selecionar ícone"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Buscar ícone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="h-[200px]">
          <div className="grid grid-cols-6 gap-1 p-2">
            {filteredIcons.map((iconName) => {
              const Icon = iconMap[iconName];
              return (
                <Button
                  key={iconName}
                  variant={value === iconName ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    onChange(iconName);
                    setOpen(false);
                    setSearchTerm("");
                  }}
                  title={iconName}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;
