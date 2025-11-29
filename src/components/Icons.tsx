import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  AtSign,
  Bell,
  Check,
  ChevronDown,
  Copy,
  CornerUpLeft,
  Eye,
  EyeOff,
  Hash,
  Headphones,
  HeadphoneOff,
  Home,
  Image,
  Keyboard,
  LogOut,
  Mic,
  MicOff,
  MoreVertical,
  PenLine,
  PhoneOff,
  Plus,
  ScreenShare,
  ScreenShareOff,
  Search,
  Send,
  Server,
  Settings,
  Shield,
  Signal,
  Smile,
  Ticket,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  UsersRound,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

const createIcon =
  (IconComponent: LucideIcon): React.FC<IconProps> =>
  ({ size = 20, color = "currentColor", className = "", strokeWidth = 1.6 }) =>
    (
      <IconComponent
        size={size}
        color={color}
        className={className}
        strokeWidth={strokeWidth}
      />
    );

export const HomeIcon = createIcon(Home);
export const SettingsIcon = createIcon(Settings);
export const AddIcon = createIcon(Plus);
export const CloseIcon = createIcon(X);
export const ReplyIcon = createIcon(CornerUpLeft);
export const EditIcon = createIcon(PenLine);
export const DeleteIcon = createIcon(Trash2);
export const TrashIcon = createIcon(Trash2);
export const MoreVerticalIcon = createIcon(MoreVertical);
export const UsersIcon = createIcon(Users);
export const LogoutIcon = createIcon(LogOut);
export const UploadIcon = createIcon(Upload);
export const ImageIcon = createIcon(Image);
export const EmojiIcon = createIcon(Smile);
export const HashIcon = createIcon(Hash);
export const AtIcon = createIcon(AtSign);
export const BellIcon = createIcon(Bell);
export const SendIcon = createIcon(Send);
export const CheckIcon = createIcon(Check);
export const SearchIcon = createIcon(Search);
export const MicIcon = createIcon(Mic);
export const MicOffIcon = createIcon(MicOff);
export const HeadphoneIcon = createIcon(Headphones);
export const HeadphoneOffIcon = createIcon(HeadphoneOff);
export const PhoneOffIcon = createIcon(PhoneOff);
export const VolumeUpIcon = createIcon(Volume2);
export const VolumeIcon = createIcon(Volume1);
export const VolumeOffIcon = createIcon(VolumeX);
export const UserIcon = createIcon(User);
export const ShieldIcon = createIcon(Shield);
export const KeyboardIcon = createIcon(Keyboard);
export const ChevronDownIcon = createIcon(ChevronDown);
export const ServerIcon = createIcon(Server);
export const CommunityIcon = createIcon(UsersRound);
export const InviteIcon = createIcon(Ticket);
export const CopyIcon = createIcon(Copy);
export const EyeIcon = createIcon(Eye);
export const EyeOffIcon = createIcon(EyeOff);
export const SignalIcon = createIcon(Signal);
export const ScreenShareIcon = createIcon(ScreenShare);
export const ScreenShareOffIcon = createIcon(ScreenShareOff);
export const UserCheckIcon = createIcon(UserCheck);
export const UserPlusIcon = createIcon(UserPlus);
export const UserXIcon = createIcon(UserX);
export const XIcon = createIcon(X);
