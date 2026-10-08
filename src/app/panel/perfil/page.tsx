import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { roleLabel } from "@/lib/format";
import { ProfileForm } from "@/components/profile-form";
import { Badge, PageHeader } from "@/components/ui";

export default async function ProfilePage() {
  const session = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: session.id } });
  return (
    <>
      <PageHeader
        title="Mi perfil"
        description={user.email}
        actions={<Link href={`/usuarios/${user.id}`} className="text-sm font-semibold underline">Ver perfil público</Link>}
      />
      <div className="mb-6 flex gap-2">
        <Badge tone="brand">{roleLabel[user.role]}</Badge>
        {user.verified ? <Badge tone="green"><BadgeCheck className="h-3.5 w-3.5" /> Identidad verificada</Badge> : <Badge tone="amber">Verificación pendiente</Badge>}
      </div>
      <ProfileForm profile={user} />
    </>
  );
}
