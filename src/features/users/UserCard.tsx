import React from 'react';
import { 
  KeyRound, Phone, Mail, Trash2, Edit2, CheckCircle2, 
  XCircle, Eye, EyeOff 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { User } from '../../types';
import { ROLES_INFO } from './userConstants';

interface UserCardProps {
  user: User;
  isSelf: boolean;
  isOwner: boolean;
  isPinVisible: boolean;
  onTogglePin: () => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onUseProfile: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  isSelf,
  isOwner,
  isPinVisible,
  onTogglePin,
  onToggleActive,
  onEdit,
  onUseProfile,
  onDelete,
  canDelete,
}) => {
  const roleMeta = ROLES_INFO[user.role] || ROLES_INFO.Mozo;
  const RoleIcon = roleMeta.icon;

  return (
    <div 
      className={cn(
        "bg-white rounded-3xl p-5 border shadow-sm flex flex-col justify-between gap-4 transition-all relative overflow-hidden",
        isSelf ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20" : "border-stone-200 hover:border-stone-300",
        !user.active && "opacity-60 bg-stone-50"
      )}
    >
      {/* Header de la tarjeta */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border shrink-0",
              roleMeta.bgColor, roleMeta.textColor, roleMeta.borderColor
            )}>
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-black text-sm text-stone-900 leading-snug">{user.name}</h4>
                {isSelf && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-black">
                    TÚ
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-semibold mt-0.5">@{user.username}</p>
            </div>
          </div>

          <span className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 shrink-0",
            roleMeta.badgeColor
          )}>
            <RoleIcon className="w-3.5 h-3.5" />
            {user.role}
          </span>
        </div>

        {/* Estado activo toggle badge */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Estado de Acceso:</span>
          <button
            onClick={onToggleActive}
            disabled={isSelf}
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-black border transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed",
              user.active 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
            )}
            title={isSelf ? 'No puedes cambiar tu propio estado' : 'Clic para activar/desactivar'}
          >
            {user.active ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Habilitado</span>
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 text-rose-600" />
                <span>Bloqueado</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Información de contacto y PIN */}
      <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-100 text-xs space-y-2 font-semibold text-stone-600">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-stone-500">
            <KeyRound className="w-3.5 h-3.5 text-amber-600" /> 
            PIN de Acceso:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-black text-stone-900 bg-white px-2 py-0.5 rounded-lg border border-stone-200 text-xs tracking-wider">
              {isPinVisible ? (user.pin || "1234") : "••••"}
            </span>
            <button
              onClick={onTogglePin}
              className="p-1 text-stone-400 hover:text-stone-700 rounded transition"
              title={isPinVisible ? "Ocultar PIN" : "Ver PIN"}
            >
              {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {user.phone && (
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 text-stone-500">
              <Phone className="w-3.5 h-3.5 text-stone-400" /> Teléfono:
            </span>
            <span className="font-bold text-stone-800">{user.phone}</span>
          </div>
        )}

        {user.email && (
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 text-stone-500">
              <Mail className="w-3.5 h-3.5 text-stone-400" /> Email:
            </span>
            <span className="font-bold text-stone-800 truncate max-w-[160px]">{user.email}</span>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
        <button
          onClick={onEdit}
          className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-98"
        >
          <Edit2 className="w-3.5 h-3.5" /> Editar
        </button>

        {/* Solo el rol Owner puede cambiar o usar perfiles directamente */}
        {!isSelf && isOwner && (
          <button
            onClick={onUseProfile}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-black transition"
            title="Iniciar sesión rápida como este usuario (Solo visible para Owner)"
          >
            Usar Perfil
          </button>
        )}

        {!isSelf && canDelete && (isOwner || user.role !== 'Owner') && (
          <button
            onClick={onDelete}
            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
            title="Eliminar usuario permanentemente"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
