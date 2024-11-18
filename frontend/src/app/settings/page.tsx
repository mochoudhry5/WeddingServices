"use client";

import React, { useState } from "react";
import {
  Settings,
  User,
  Lock,
  Bell,
  CreditCard,
  HelpCircle,
  Shield,
  LogOut,
} from "lucide-react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const SectionLayout = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="min-h-[390px] flex flex-col">
    <div className="mb-6">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    {children}
  </div>
);

const AccountSettings = () => (
  <SectionLayout
    title="Profile Information"
    description="Update your account information."
  >
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <Input defaultValue="John" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <Input defaultValue="Doe" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <Input type="email" defaultValue="john.doe@example.com" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <Input type="tel" defaultValue="+1 (555) 123-4567" />
      </div>

      <div className="pt-4">
        <button className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  </SectionLayout>
);

const SecuritySettings = () => (
  <SectionLayout
    title="Security Settings"
    description="Manage your account security."
  >
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Password
        </label>
        <Input type="password" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New Password
        </label>
        <Input type="password" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm New Password
        </label>
        <Input type="password" />
      </div>

      <div className="pt-4 mt-2">
        <button className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors">
          Update Password
        </button>
      </div>
    </div>
  </SectionLayout>
);

const NotificationSettings = () => (
  <SectionLayout
    title="Notification Preferences"
    description="Manage how you receive notifications."
  >
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-700">
            Email Notifications
          </p>
          <p className="text-sm text-gray-500">Receive updates via email</p>
        </div>
        <Switch />
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-700">SMS Notifications</p>
          <p className="text-sm text-gray-500">Receive updates via text</p>
        </div>
        <Switch />
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-700">Marketing</p>
          <p className="text-sm text-gray-500">Receive promotional content</p>
        </div>
        <Switch />
      </div>
    </div>
  </SectionLayout>
);

const PaymentSettings = () => (
  <SectionLayout
    title="Payment Methods"
    description="Manage your payment information."
  >
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
              <CreditCard size={20} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium">•••• •••• •••• 4242</p>
              <p className="text-xs text-gray-500">Expires 12/24</p>
            </div>
          </div>
          <button className="text-sm text-rose-600 hover:text-rose-700">
            Remove
          </button>
        </div>
      </div>

      <button className="w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-rose-600 hover:text-rose-700 hover:border-rose-200 transition-colors flex items-center justify-center space-x-2">
        <CreditCard size={16} />
        <span>Add Payment Method</span>
      </button>
    </div>
  </SectionLayout>
);

function SettingsPage() {
  const [activeSection, setActiveSection] = useState("account");

  const menuItems = [
    { id: "account", label: "Account", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "payments", label: "Payments", icon: CreditCard },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return <AccountSettings />;
      case "security":
        return <SecuritySettings />;
      case "notifications":
        return <NotificationSettings />;
      case "payments":
        return <PaymentSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-56 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm">
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                      activeSection === item.id
                        ? "bg-rose-50 text-rose-600 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </button>
                ))}

                <button className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default SettingsPage;
