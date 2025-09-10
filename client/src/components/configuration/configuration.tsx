"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Settings } from "lucide-react";
import { DataConnector } from "./data-connector";
import { PromptSetup } from "./prompt-setup";
import { SchemaEnrichment } from "./schema-enrichment";
import { TrainingConsole } from "./training-console";

type SidebarOption =
  | "Data Connector"
  | "Schema Enrichment"
  | "Prompt Setup"
  | "Training Console"
  | "Generation Configs";

interface ConfigurationProps {
  onClose: () => void;
}

export function Configuration({ onClose }: ConfigurationProps) {
  const [selectedSidebarOption, setSelectedSidebarOption] =
    useState<SidebarOption>("Data Connector");

  const [message, setMessage] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState<boolean>(false);

  const closeMessage = () => {
    setShowMessage(false);
    setMessage(null);
  };

  const renderContent = () => {
    switch (selectedSidebarOption) {
      case "Data Connector":
        return (
          <DataConnector
            setMessage={setMessage}
            setShowMessage={setShowMessage}
          />
        );
      case "Schema Enrichment":
        return (
          <SchemaEnrichment
            setMessage={setMessage}
            setShowMessage={setShowMessage}
          />
        );
      case "Prompt Setup":
        return (
          <PromptSetup
            setMessage={setMessage}
            setShowMessage={setShowMessage}
          />
        );
      case "Training Console":
        return (
          <TrainingConsole
            setMessage={setMessage}
            setShowMessage={setShowMessage}
          />
        );
      case "Generation Configs":
        return (
          <div className="flex-grow p-4 md:p-8 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800">
              Generation Configs
            </h3>
            <p className="text-gray-600 mt-4">
              Review & Create API description content goes here.
            </p>
            <div className="h-48 bg-gray-100 mt-4 flex items-center justify-center text-gray-500">
              Additional Generation Config settings.
            </div>
            <div className="h-48 bg-gray-100 mt-4 flex items-center justify-center text-gray-500">
              More configuration data.
            </div>
            <div className="h-48 bg-gray-100 mt-4 flex items-center justify-center text-gray-500">
              API description details.
            </div>
            <div className="h-48 bg-gray-100 mt-4 flex items-center justify-center text-gray-500">
              Final item to ensure scrolling.
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-100 flex flex-col">
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 border-b border-gray-800 bg-gray-800">
          <h2 className="text-lg md:text-2xl font-bold flex items-center text-white-800">
            <Settings className="text-blue-500 mr-3" size={24} />
            Data Connection Configuration
          </h2>
          <Button
            variant="ghost"
            onClick={onClose}
            className="gap-1 text-white-600 hover:text-white-900"
          >
            <X size={25} />
            Close
          </Button>
        </div>
        <div className="flex flex-1 flex-col md:flex-row">
          {/* Sidebar */}
          <nav className="w-full md:w-64 bg-gray-800 text-white p-4 md:p-6 flex-shrink-0">
            <ul className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-4">
              {(
                [
                  "Data Connector",
                  "Schema Enrichment",
                  "Prompt Setup",
                  "Training Console",
                  "Generation Configs",
                ] as SidebarOption[]
              ).map((option) => (
                <li key={option}>
                  <button
                    className={`block w-full text-left py-2 md:py-3 px-2 md:px-4 rounded-lg transition-colors duration-200
                                        ${
                                          selectedSidebarOption === option
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                                        }`}
                    onClick={() => setSelectedSidebarOption(option)}
                  >
                    {option}
                    <p className="hidden md:block text-xs text-gray-400 mt-1">
                      {option === "Data Connector" &&
                        "Data Connector description"}
                      {option === "Schema Enrichment" &&
                        "Table Schema description"}
                      {option === "Prompt Setup" &&
                        "Prompt Components description"}
                      {option === "Training Console" &&
                        "Dynamic Examples description"}
                      {option === "Generation Configs" &&
                        "Review & Create API description"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          {/* Content */}
          <main className="flex-1 w-full bg-gray-200 p-4 md:p-8">
            {renderContent()}
          </main>
        </div>

        {showMessage && message && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
              <h4 className="text-lg font-semibold mb-4">Connection Attempt</h4>
              <p className="text-gray-700 mb-6">{message}</p>
              <div className="flex justify-end">
                <Button
                  onClick={closeMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
