import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Upload, X, Building2, Bell } from "lucide-react";
import api from "@/lib/axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPaymentConfig, setSavingPaymentConfig] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Branding State
  const [branding, setBranding] = useState({
    logoUrl: "",
    primaryColor: "#0F172A",
    secondaryColor: "#2563EB",
    registrationNo: ""
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Organization Profile State
  const [profile, setProfile] = useState({
    name: "",
    description: "",
    address: "",
    websiteUrl: "",
    phone: "",
    email: "",
    facebookUrl: "",
    twitterUrl: "",
    instagramUrl: "",
    taxExemption: false
  });

  const [paymentConfig, setPaymentConfig] = useState({
    merchantId: "",
    apiKey: "",
    isLiveMode: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/settings/organization');

      setBranding({
        logoUrl: data.logoUrl || "",
        primaryColor: data.primaryColor || "#0F172A",
        secondaryColor: data.secondaryColor || "#2563EB",
        registrationNo: data.registrationNo || ""
      });

      if (data.logoUrl) {
        setLogoPreview(`${API_URL.replace('/api', '')}${data.logoUrl}`);
      }

      setProfile({
        name: data.name || "",
        description: data.description || "",
        address: data.address || "",
        websiteUrl: data.websiteUrl || "",
        phone: data.phone || "",
        email: data.email || "",
        facebookUrl: data.facebookUrl || "",
        twitterUrl: data.twitterUrl || "",
        instagramUrl: data.instagramUrl || "",
        taxExemption: data.taxExemption || false
      });

      const safepayConfig = Array.isArray(data.paymentConfigs)
        ? data.paymentConfigs.find((config: any) => config.provider === 'SAFEPAY')
        : undefined;

      setPaymentConfig({
        merchantId: safepayConfig?.merchantId || "",
        apiKey: safepayConfig?.apiKey || "",
        isLiveMode: safepayConfig?.isLiveMode ?? false,
      });
    } catch (error) {
      console.error("Failed to fetch settings", error);
      alert("Failed to load settings. Make sure you're logged in as an Org Admin.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File too large. Max 2MB.");
        return;
      }
      setLogoFile(file);
      // Show immediate preview using blob URL
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBrandingSave = async () => {
    setSavingBranding(true);
    try {
      const formData = new FormData();
      formData.append('primaryColor', branding.primaryColor);
      formData.append('secondaryColor', branding.secondaryColor);
      formData.append('registrationNo', branding.registrationNo);

      if (logoFile) {
        formData.append('logo', logoFile);
      } else if (branding.logoUrl) {
        formData.append('logoUrl', branding.logoUrl);
      }

      await api.patch('/settings/branding', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // ✅ Clear the file state after successful upload
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // ✅ Refetch settings to get the server URL and update preview
      await fetchSettings();

      alert("✅ Branding saved successfully!");
    } catch (error: any) {
      console.error("Full Error:", error);
      const nestErrors = error.response?.data?.message;
      console.error("NestJS Errors:", nestErrors);

      const errorMsg = Array.isArray(nestErrors)
        ? nestErrors.join('\n')
        : (error.response?.data?.message || 'Failed to save branding');

      alert(`❌ Error:\n${errorMsg}`);
    } finally {
      setSavingBranding(false);
    }
  };

  const removeLogoPreview = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setBranding({ ...branding, logoUrl: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      await api.patch('/organizations/me', profile);
      alert("✅ Profile updated successfully!");
    } catch (error) {
      alert("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePaymentConfigSave = async () => {
    setSavingPaymentConfig(true);
    try {
      await api.post('/settings/payments/SAFEPAY', paymentConfig);
      alert("✅ SafePay configuration saved successfully!");
    } catch (error: any) {
      console.error("Failed to save payment config", error);
      alert(error.response?.data?.message || "Failed to save payment configuration");
    } finally {
      setSavingPaymentConfig(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage your NGO's branding, profile, and notification preferences.
        </p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-4xl">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* BRANDING TAB */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Identity</CardTitle>
              <CardDescription>
                Customize how your organization appears on public donation pages and receipts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload Section */}
              <div className="space-y-3">
                <Label>Organization Logo</Label>
                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden relative">
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                        <button
                          onClick={removeLogoPreview}
                          className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 hover:bg-destructive/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mt-1">No logo</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {logoPreview ? 'Replace Logo' : 'Upload Logo'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WebP or SVG. Max 2MB. Recommended: 400x400px
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="w-16 p-1 h-10 cursor-pointer rounded-md border"
                    />
                    <Input
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                      className="w-16 p-1 h-10 cursor-pointer rounded-md border"
                    />
                    <Input
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>NGO Registration Number</Label>
                <Input
                  placeholder="e.g., NGO-2026-001"
                  value={branding.registrationNo}
                  onChange={(e) => setBranding({ ...branding, registrationNo: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">This will appear on tax exemption receipts.</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-6">
              <Button onClick={handleBrandingSave} disabled={savingBranding}>
                {savingBranding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Branding
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ORGANIZATION PROFILE TAB */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Profile
              </CardTitle>
              <CardDescription>
                Your legal information, contact details, and social media presence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Cannot be changed. Contact support to update.</p>
              </div>

              <div className="space-y-2">
                <Label>Description / Mission</Label>
                <Textarea
                  placeholder="Tell donors about your organization's mission..."
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    placeholder="contact@yourngo.org"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    placeholder="+92 300 1234567"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Office Address</Label>
                <Textarea
                  placeholder="Complete physical address for official correspondence"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input
                  placeholder="https://www.yourngo.org"
                  value={profile.websiteUrl}
                  onChange={(e) => setProfile({ ...profile, websiteUrl: e.target.value })}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-semibold">Social Media Links</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Facebook URL"
                    value={profile.facebookUrl}
                    onChange={(e) => setProfile({ ...profile, facebookUrl: e.target.value })}
                  />
                  <Input
                    placeholder="Twitter/X URL"
                    value={profile.twitterUrl}
                    onChange={(e) => setProfile({ ...profile, twitterUrl: e.target.value })}
                  />
                  <Input
                    placeholder="Instagram URL"
                    value={profile.instagramUrl}
                    onChange={(e) => setProfile({ ...profile, instagramUrl: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Tax Exemption Certificate</Label>
                  <p className="text-sm text-muted-foreground">
                    Mark this organization as eligible for donor tax exemptions under Pakistan law.
                  </p>
                </div>
                <Switch
                  checked={profile.taxExemption}
                  onCheckedChange={(checked) => setProfile({ ...profile, taxExemption: checked })}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-6">
              <Button onClick={handleProfileSave} disabled={savingProfile}>
                {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Profile
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* PAYMENT SETTINGS TAB */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Payment Settings
              </CardTitle>
              <CardDescription>
                Configure SafePay credentials for your organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Payment Provider</Label>
                <Input value="SafePay" disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label>Merchant ID</Label>
                <Input
                  placeholder="Enter SafePay merchant ID"
                  value={paymentConfig.merchantId}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, merchantId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder="Enter SafePay API key"
                  value={paymentConfig.apiKey}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, apiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Store your SafePay secret key here. It will be used for payment session creation.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Live Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable production mode for SafePay. Leave off for sandbox testing.
                  </p>
                </div>
                <Switch
                  checked={paymentConfig.isLiveMode}
                  onCheckedChange={(checked) => setPaymentConfig({ ...paymentConfig, isLiveMode: checked })}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-6">
              <Button onClick={handlePaymentConfigSave} disabled={savingPaymentConfig}>
                {savingPaymentConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Payment Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose what email updates your admins receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">New Donation Alerts</Label>
                  <p className="text-sm text-muted-foreground">Email every time a new donation is made.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Weekly Summary Report</Label>
                  <p className="text-sm text-muted-foreground">Weekly email with campaigns & funds summary.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Campaign Goal Reached</Label>
                  <p className="text-sm text-muted-foreground">Instant alert when campaign hits its target.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-6">
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}