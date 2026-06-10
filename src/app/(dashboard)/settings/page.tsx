"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { updateSetting } from "@/actions/settings";
import { useUserSettings } from "@/hooks/use-user-settings";

const PACKAGE_VERSION = "0.1.0";
const BUILD_INFO = process.env.NODE_ENV === "production" ? "Sản xuất" : "Phát triển";

export default function SettingsPage() {
  const { toast } = useToast();
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [weatherApiKey, setWeatherApiKey] = useState("");
  const [theme, setTheme] = useState("light");
  const [saving, setSaving] = useState(false);
  const { settings, updateSettings } = useUserSettings();
  const [lang, setLang] = useState(settings.language);
  const [dateFmt, setDateFmt] = useState(settings.dateFormat);
  const [tz, setTz] = useState(settings.timezone);
  const [currency, setCurrency] = useState(settings.currency);
  const [curDec, setCurDec] = useState(settings.currencyDec ?? 0);

  async function handleSavePersonalization() {
    setSaving(true);
    try {
      await updateSettings({
        language: lang,
        theme,
        dateFormat: dateFmt,
        timezone: tz,
        currency,
        currencyDec: curDec,
      });
      toast({ title: "Đã lưu cá nhân hóa" });
    } catch {
      toast({ title: "Lỗi khi lưu", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const storedLat = localStorage.getItem("settings:lat");
    const storedLon = localStorage.getItem("settings:lon");
    const storedTheme = localStorage.getItem("settings:theme");
    if (storedLat) setLat(storedLat);
    if (storedLon) setLon(storedLon);
    if (storedTheme) setTheme(storedTheme);
  }, []);

  async function handleSaveGeneral() {
    setSaving(true);
    try {
      localStorage.setItem("settings:lat", lat);
      localStorage.setItem("settings:lon", lon);
      localStorage.setItem("settings:weatherApiKey", weatherApiKey);
      await updateSetting("projectLat", lat);
      await updateSetting("projectLon", lon);
      await updateSetting("weatherApiKey", weatherApiKey);
      toast({ title: "Đã lưu cài đặt chung" });
    } catch {
      toast({ title: "Lỗi khi lưu", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAppearance() {
    setSaving(true);
    try {
      localStorage.setItem("settings:theme", theme);
      await updateSetting("defaultTheme", theme);
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
      toast({ title: "Đã lưu giao diện" });
    } catch {
      toast({ title: "Lỗi khi lưu", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cài đặt</h1>

      <Card>
        <CardHeader>
          <CardTitle>Chung</CardTitle>
          <CardDescription>Tọa độ dự án và API key thời tiết</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat">Vĩ độ</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="VD: 21.0285"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lon">Kinh độ</Label>
              <Input
                id="lon"
                type="number"
                step="any"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                placeholder="VD: 105.8542"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weatherApiKey">API Key thời tiết</Label>
            <Input
              id="weatherApiKey"
              type="password"
              value={weatherApiKey}
              onChange={(e) => setWeatherApiKey(e.target.value)}
              placeholder="Nhập API key dịch vụ thời tiết"
            />
          </div>
          <Button onClick={handleSaveGeneral} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu cài đặt chung"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Giao diện</CardTitle>
          <CardDescription>Chọn theme mặc định</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme">
                <SelectValue placeholder="Chọn theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Sáng</SelectItem>
                <SelectItem value="dark">Tối</SelectItem>
                <SelectItem value="system">Theo hệ thống</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveAppearance} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu giao diện"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Cá nhân hóa</CardTitle>
          <CardDescription>Ngôn ngữ, định dạng ngày, múi giờ và tiền tệ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Ngôn ngữ</Label>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Chọn ngôn ngữ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateFormat">Định dạng ngày</Label>
            <Select value={dateFmt} onValueChange={setDateFmt}>
              <SelectTrigger id="dateFormat">
                <SelectValue placeholder="Chọn định dạng ngày" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Múi giờ</Label>
            <Select value={tz} onValueChange={setTz}>
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Chọn múi giờ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (UTC+7)</SelectItem>
                <SelectItem value="Asia/Bangkok">Asia/Bangkok (UTC+7)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Asia/Singapore">Asia/Singapore (UTC+8)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Tiền tệ</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Chọn tiền tệ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VND">VND</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currencyDec">Số thập phân tiền tệ</Label>
            <Input
              id="currencyDec"
              type="number"
              value={curDec}
              onChange={(e) => setCurDec(Number(e.target.value))}
            />
          </div>
          <Button onClick={handleSavePersonalization} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu cá nhân hóa"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Thông tin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phiên bản</span>
            <span className="font-mono">{PACKAGE_VERSION}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Môi trường</span>
            <span className="font-mono">{BUILD_INFO}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Node.js</span>
            <span className="font-mono">{typeof process !== "undefined" ? process.version : "-"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
