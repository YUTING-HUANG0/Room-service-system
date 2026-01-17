"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async () => {
        setLoading(true);
        const { error, data: { user } } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            alert("登入失敗：" + error.message);
            setLoading(false);
            return;
        }

        // Fetch User Role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user?.id)
            .single();

        const role = profile?.role;

        router.refresh();

        if (role === 'admin') {
            router.push("/admin/calendar");
        } else if (role === 'housekeeper') {
            router.push("/housekeeper/tasks");
        } else {
            // Default or fallback
            router.push("/admin");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">登入系統</CardTitle>
                    <CardDescription>
                        請輸入您的 Email 與密碼以存取後台
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">密碼</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button
                        className="w-full"
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? "登入中..." : "登入"}
                    </Button>
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button variant="outline" asChild>
                            <Link href="/auth/register">註冊帳號</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/">回首頁</Link>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}