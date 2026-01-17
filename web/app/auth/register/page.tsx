"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("housekeeper");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleRegister = async () => {
        if (!email || !password || !fullName) {
            alert("請填寫所有欄位");
            return;
        }

        setLoading(true);

        // 1. Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });

        if (authError) {
            alert("註冊失敗：" + authError.message);
            setLoading(false);
            return;
        }

        const user = authData.user;
        if (!user) {
            alert("註冊後無法取得使用者資訊");
            setLoading(false);
            return;
        }

        // 2. Create Profile (Role)
        // Note: Check if RLS allows inserting. If not, this might fail unless backend trigger handles it.
        // Assuming we need to insert manually or have Public insert access for authenticated user (self).

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                full_name: fullName,
                role: role,
                updated_at: new Date()
            });

        if (profileError) {
            console.error("Profile creation failed", profileError);
            // Usually triggers handle this, but if we do it client side:
            alert("帳號建立成功，但個人資料設定失敗。請聯繫管理員。");
        } else {
            alert("註冊成功！");

            // Redirect based on role
            router.refresh(); // Refresh to update session
            if (role === 'admin') {
                router.push("/admin/calendar");
            } else {
                router.push("/housekeeper/tasks");
            }
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">註冊新帳號</CardTitle>
                    <CardDescription>
                        建立您的員工或管理員帳號
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">姓名</Label>
                        <Input
                            id="name"
                            placeholder="王大明"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">密碼</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role">角色</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="選擇角色" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="housekeeper">房務員 (Housekeeper)</SelectItem>
                                <SelectItem value="admin">老闆/管理員 (Admin)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button
                        className="w-full"
                        onClick={handleRegister}
                        disabled={loading}
                    >
                        {loading ? "註冊中..." : "註冊"}
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/auth/login">已有帳號？登入</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
