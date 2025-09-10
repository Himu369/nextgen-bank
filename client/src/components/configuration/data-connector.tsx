"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useDataInsights } from "@/components/data-context";

// Tab icons
import { ClipboardList, Database, Settings, Share2 } from "lucide-react";

// Interfaces
interface DataConnectorProps {
  setMessage: (message: string | null) => void;
  setShowMessage: (show: boolean) => void;
}

interface UseCase {
  value: string;
  label: string;
}

interface Check {
  id: string;
  name: string;
  type: string;
  default_selected: boolean;
  disabled: boolean;
}

export function DataConnector({
  setMessage,
  setShowMessage,
}: DataConnectorProps) {
  const {
    dbConfig,
    setDbConfig,
    llmConfig,
    setLlmConfig,
    ragConfig,
    setRagConfig,
    analysisConfig,
    setAnalysisConfig,
  } = useDataInsights();

  // Loading and error states
  const [databaseOptions, setDatabaseOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [availableLlmModels, setAvailableLlmModels] = useState<any | null>(
    null
  );
  const [llmLoading, setLlmLoading] = useState<boolean>(true);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [llmModelNameOptions, setLlmModelNameOptions] = useState<string[]>([]);
  const [generationModelOptions, setGenerationModelOptions] = useState<
    string[]
  >([]);

  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [useCaseLoading, setUseCaseLoading] = useState<boolean>(true);
  const [useCaseError, setUseCaseError] = useState<string | null>(null);

  const [dormantChecks, setDormantChecks] = useState<Check[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<Check[]>([]);
  const [checksLoading, setChecksLoading] = useState<boolean>(false);
  const [checksError, setChecksError] = useState<string | null>(null);

  const embeddingProviderOptions = ["Hugging Face", "OpenAI", "Cohere"];
  const vectorDBTypeOptions = [
    "Azure Cosmos DB",
    "Pinecone",
    "Weaviate",
    "Qdrant",
    "Chroma",
  ];

  // Section state (tabs)
  const [selectedSection, setSelectedSection] = useState<
    "analysis" | "database" | "llm" | "rag"
  >("analysis");

  // Fetch database types
  useEffect(() => {
    const fetchDatabaseTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          "https://config-api-service-641805125303.us-central1.run.app/db/databases"
        );
        const data = response.data;
        if (
          data &&
          Array.isArray(data.databases) &&
          data.databases.every(
            (db: any) => typeof db === "object" && db !== null && "id" in db
          )
        ) {
          const ids = data.databases.map((db: any) => db.id);
          setDatabaseOptions(ids);
          if (ids.length > 0 && !dbConfig.databaseType) {
            setDbConfig((prev) => ({ ...prev, databaseType: ids[0] }));
          }
        } else {
          setError("Unexpected API response format or missing 'id' property.");
        }
      } catch (err: any) {
        setError(`Failed to load database types: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchDatabaseTypes();
  }, [dbConfig.databaseType, setDbConfig]);

  // Fetch LLM models
  useEffect(() => {
    const fetchLlmModels = async () => {
      try {
        setLlmLoading(true);
        setLlmError(null);
        const response = await axios.get(
          "https://fastapi-rag-app-641805125303.us-central1.run.app/llm/available"
        );
        const data = response.data;
        if (data && data.available) {
          setAvailableLlmModels(data);
          const providers = Object.keys(data.available);

          if (providers.length > 0) {
            if (!llmConfig.llmProvider) {
              setLlmConfig((prev) => ({ ...prev, llmProvider: providers[0] }));
            }
            const initialModels =
              data.available[llmConfig.llmProvider || providers[0]];
            if (initialModels.length > 0 && !llmConfig.llmModelName) {
              setLlmConfig((prev) => ({
                ...prev,
                llmModelName: initialModels[0],
              }));
            }
            if (!ragConfig.generationLlmProvider) {
              setRagConfig((prev) => ({
                ...prev,
                generationLlmProvider: providers[0],
              }));
            }
            const initialGenModels =
              data.available[ragConfig.generationLlmProvider || providers[0]];
            if (initialGenModels.length > 0 && !ragConfig.generationModel) {
              setRagConfig((prev) => ({
                ...prev,
                generationModel: initialGenModels[0],
              }));
            }
          }
        } else {
          setLlmError("Unexpected API response format for LLM models.");
        }
      } catch (err: any) {
        setLlmError(`Failed to load LLM models: ${err.message}`);
      } finally {
        setLlmLoading(false);
      }
    };
    fetchLlmModels();
  }, [
    llmConfig.llmProvider,
    llmConfig.llmModelName,
    ragConfig.generationLlmProvider,
    ragConfig.generationModel,
    setLlmConfig,
    setRagConfig,
  ]);

  // Update LLM models when provider changes
  useEffect(() => {
    if (availableLlmModels && llmConfig.llmProvider) {
      const models = availableLlmModels.available[llmConfig.llmProvider] || [];
      setLlmModelNameOptions(models);
      if (models.length > 0 && !models.includes(llmConfig.llmModelName)) {
        setLlmConfig((prev) => ({ ...prev, llmModelName: models[0] }));
      } else if (models.length === 0) {
        setLlmConfig((prev) => ({ ...prev, llmModelName: "" }));
      }
    }
  }, [
    llmConfig.llmProvider,
    availableLlmModels,
    llmConfig.llmModelName,
    setLlmConfig,
  ]);

  // Update RAG models when generation provider changes
  useEffect(() => {
    if (availableLlmModels && ragConfig.generationLlmProvider) {
      const models =
        availableLlmModels.available[ragConfig.generationLlmProvider] || [];
      setGenerationModelOptions(models);
      if (models.length > 0 && !models.includes(ragConfig.generationModel)) {
        setRagConfig((prev) => ({ ...prev, generationModel: models[0] }));
      } else if (models.length === 0) {
        setRagConfig((prev) => ({ ...prev, generationModel: "" }));
      }
    }
  }, [
    ragConfig.generationLlmProvider,
    availableLlmModels,
    ragConfig.generationModel,
    setRagConfig,
  ]);

  // Fetch use cases
  useEffect(() => {
    const fetchUseCases = async () => {
      try {
        setUseCaseLoading(true);
        setUseCaseError(null);
        const response = await axios.get(
          "https://compliance-agent-api-641805125303.us-central1.run.app/get_use_cases"
        );
        const data = response.data;
        if (data && Array.isArray(data.use_cases)) {
          setUseCases(data.use_cases);
          if (data.use_cases.length > 0 && !analysisConfig.selectedUseCase) {
            setAnalysisConfig((prev) => ({
              ...prev,
              selectedUseCase: data.use_cases[0].value,
            }));
          }
        } else {
          setUseCaseError("Unexpected API response format.");
        }
      } catch (err: any) {
        setUseCaseError(`Failed to load use cases: ${err.message}`);
      } finally {
        setUseCaseLoading(false);
      }
    };
    fetchUseCases();
  }, [analysisConfig.selectedUseCase, setAnalysisConfig]);

  // Fetch checks for use case
  useEffect(() => {
    const fetchChecks = async () => {
      if (!analysisConfig.selectedUseCase) {
        setDormantChecks([]);
        setComplianceChecks([]);
        return;
      }
      try {
        setChecksLoading(true);
        setChecksError(null);
        const encodedUseCase = encodeURIComponent(
          analysisConfig.selectedUseCase
        );
        const response = await axios.get(
          `https://compliance-agent-api-641805125303.us-central1.run.app/get_checks/${encodedUseCase}`
        );
        const data = response.data;
        if (data) {
          if (Array.isArray(data.dormant_checks)) {
            setDormantChecks(data.dormant_checks);

            if (analysisConfig.selectedDormantChecks.length === 0) {
              let initialSelectedDormant: string[] = [];
              const SELECT_ALL_ID = data.dormant_checks.find(
                (check: Check) => check.name === "Select All Dormant Checks"
              )?.id;

              const defaultSelectedRegularDormant = data.dormant_checks
                .filter(
                  (check: Check) =>
                    check.default_selected && check.id !== SELECT_ALL_ID
                )
                .map((check: Check) => check.id);

              initialSelectedDormant.push(...defaultSelectedRegularDormant);

              const allRegularDormantChecks = data.dormant_checks.filter(
                (check: Check) => check.id !== SELECT_ALL_ID
              );
              const areAllRegularDormantDefaultSelected =
                allRegularDormantChecks.length > 0 &&
                allRegularDormantChecks.every(
                  (check: Check) => check.default_selected
                );

              if (SELECT_ALL_ID && areAllRegularDormantDefaultSelected) {
                initialSelectedDormant.push(SELECT_ALL_ID);
              }
              setAnalysisConfig((prev) => ({
                ...prev,
                selectedDormantChecks: initialSelectedDormant,
              }));
            }
          } else {
            setDormantChecks([]);
          }

          if (Array.isArray(data.compliance_checks)) {
            setComplianceChecks(data.compliance_checks);
            if (analysisConfig.selectedComplianceChecks.length === 0) {
              const defaultCompliance = data.compliance_checks
                .filter((check: Check) => check.default_selected)
                .map((check: Check) => check.id);
              setAnalysisConfig((prev) => ({
                ...prev,
                selectedComplianceChecks: defaultCompliance,
              }));
            }
          } else {
            setComplianceChecks([]);
          }
        } else {
          setChecksError("Unexpected API response format for checks.");
          setDormantChecks([]);
          setComplianceChecks([]);
        }
      } catch (err: any) {
        setChecksError(`Failed to load checks: ${err.message}`);
        setDormantChecks([]);
        setComplianceChecks([]);
      } finally {
        setChecksLoading(false);
      }
    };
    fetchChecks();
  }, [analysisConfig.selectedUseCase, setAnalysisConfig]);

  // Checkbox change handler
  const handleCheckboxChange = (
    checkId: string,
    isChecked: boolean,
    checkType: "dormant" | "compliance"
  ) => {
    if (checkType === "dormant") {
      const SELECT_ALL_ID = dormantChecks.find(
        (check) => check.name === "Select All Dormant Checks"
      )?.id;

      if (checkId === SELECT_ALL_ID) {
        let newSelectedDormantChecks: string[] = isChecked
          ? dormantChecks.map((c) => c.id)
          : [];
        setAnalysisConfig((prev) => ({
          ...prev,
          selectedDormantChecks: newSelectedDormantChecks,
        }));
      } else {
        setAnalysisConfig((prev) => {
          let updatedSelected = isChecked
            ? [...prev.selectedDormantChecks, checkId]
            : prev.selectedDormantChecks.filter((id) => id !== checkId);

          if (SELECT_ALL_ID) {
            const otherDormantCheckIds = dormantChecks
              .filter((check) => check.id !== SELECT_ALL_ID)
              .map((check) => check.id);

            const areAllOthersSelected =
              otherDormantCheckIds.length > 0 &&
              otherDormantCheckIds.every((id) => updatedSelected.includes(id));

            if (
              areAllOthersSelected &&
              !updatedSelected.includes(SELECT_ALL_ID)
            ) {
              updatedSelected = [...updatedSelected, SELECT_ALL_ID];
            } else if (
              !areAllOthersSelected &&
              updatedSelected.includes(SELECT_ALL_ID)
            ) {
              updatedSelected = updatedSelected.filter(
                (id) => id !== SELECT_ALL_ID
              );
            }
          }
          return { ...prev, selectedDormantChecks: updatedSelected };
        });
      }
    } else if (checkType === "compliance") {
      setAnalysisConfig((prev) => ({
        ...prev,
        selectedComplianceChecks: isChecked
          ? [...prev.selectedComplianceChecks, checkId]
          : prev.selectedComplianceChecks.filter((id) => id !== checkId),
      }));
    }
  };

  // Connect handler
  const handleConnect = async () => {
    if (
      !dbConfig.databaseType ||
      !dbConfig.connectionName ||
      !dbConfig.serverName ||
      !dbConfig.databaseName ||
      !dbConfig.portNumber ||
      !dbConfig.userName ||
      !dbConfig.databasePassword
    ) {
      setMessage(
        "Please fill in all required database connection fields, including password."
      );
      setShowMessage(true);
      return;
    }
    const parsedPort = Number(dbConfig.portNumber);
    if (isNaN(parsedPort)) {
      setMessage("Port Number must be a valid number.");
      setShowMessage(true);
      return;
    }

    try {
      setMessage("Attempting to connect and save database connection...");
      setShowMessage(true);

      const payload = {
        connection_name: dbConfig.connectionName.trim(),
        database_type: dbConfig.databaseType.trim(),
        server_name: dbConfig.serverName.trim(),
        database_name: dbConfig.databaseName.trim(),
        port: parsedPort,
        username: dbConfig.userName.trim(),
        password: dbConfig.databasePassword,
        description: dbConfig.description.trim(),
        save_connection: Boolean(dbConfig.saveConnection),
        connect_immediately: Boolean(dbConfig.connectImmediately),
      };

      const response = await axios.post(
        "https://config-api-service-641805125303.us-central1.run.app/db/connections/save",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        setMessage(`Connection saved successfully: ${response.data.message}`);
      } else {
        setMessage(
          `Failed to save connection: ${
            response.data.message || "Unknown error"
          }`
        );
      }
    } catch (err: any) {
      let errorMessage = `Error saving database connection: ${
        err.message || "Please check console for details."
      }`;
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.data && err.response.data.message) {
          errorMessage = `Failed to save connection: ${err.response.data.message}`;
        } else if (err.response.status === 400) {
          errorMessage = `Error saving database connection: Invalid request (Status 400). Please check your input fields.`;
        } else if (err.response.status === 500) {
          errorMessage = `Error saving database connection: Server error (Status 500). Please try again or contact support.`;
        } else {
          errorMessage = `Error saving database connection: ${
            err.response.status
          } - ${err.response.statusText || "Unknown error"}`;
        }
      }
      setMessage(errorMessage);
    } finally {
      setShowMessage(true);
    }
  };

  // Save analysis modes handler
  const handleSave = async () => {
    const SELECT_ALL_DORMANT_CHECKS_NAME = "Select All Dormant Checks";
    const filteredDormantChecks = analysisConfig.selectedDormantChecks.filter(
      (checkId) => {
        const check = dormantChecks.find((dCheck) => dCheck.id === checkId);
        return check && check.name !== SELECT_ALL_DORMANT_CHECKS_NAME;
      }
    );

    const payload = {
      use_case: analysisConfig.selectedUseCase,
      selected_dormant_checks: filteredDormantChecks.map((id) => {
        const check = dormantChecks.find((dCheck) => dCheck.id === id);
        return check ? check.name : id;
      }),
      selected_compliance_checks: analysisConfig.selectedComplianceChecks.map(
        (id) => {
          const check = complianceChecks.find((cCheck) => cCheck.id === id);
          return check ? check.name : id;
        }
      ),
    };

    try {
      setMessage("Saving analysis modes and checks...");
      setShowMessage(true);

      const response = await axios.post(
        "https://compliance-agent-api-641805125303.us-central1.run.app/apply_selections",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.data && response.data.message) {
        setMessage(`Success: ${response.data.message}`);
      } else {
        setMessage("Failed to save selections: Unknown error from API.");
      }
    } catch (err: any) {
      let errorMessage = `Error saving analysis modes: ${
        err.message || "Please check console for details."
      }`;
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.data && err.response.data.message) {
          errorMessage = `Failed to save selections: ${err.response.data.message}`;
        } else if (err.response.status) {
          errorMessage = `Failed to save selections: Server responded with status ${
            err.response.status
          } - ${err.response.statusText || "Unknown error"}`;
        }
      }
      setMessage(errorMessage);
    } finally {
      setShowMessage(true);
    }
  };

  // Save RAG Credentials handler
  const handleSaveRagCredentials = async () => {
    const payload = {
      generation_provider: ragConfig.generationLlmProvider.toLowerCase(),
      generation_model: ragConfig.generationModel,
      generation_api_key: ragConfig.generationApiKey,
      generation_api_base: null,
      generation_api_version: null,
      embedding_provider: ragConfig.embeddingProvider,
      embedding_model: ragConfig.embeddingModel,
      embedding_api_key: ragConfig.embeddingApiKey,
      embedding_api_base: null,
      embedding_api_version: null,
      storage_account: ragConfig.storageAccount,
      container_name: ragConfig.containerName,
      connection_string: ragConfig.connectionString,
      blob_prefix: null,
      vector_db_type: ragConfig.vectorDBType.toLowerCase().replace(/ /g, ""),
      vector_db_endpoint: ragConfig.vectorDBConnectionStringEndpoint,
      vector_db_api_key: ragConfig.vectorDBAPIKey,
      vector_db_database_name: ragConfig.cosmosDBDatabaseName,
      vector_db_container_name: ragConfig.cosmosDBContainerName,
      chunk_size: 1000,
      chunk_overlap: 200,
      top_k_retrieval: 5,
      enabled: true,
    };

    try {
      setMessage("Saving RAG Credentials...");
      setShowMessage(true);

      const response = await axios.post(
        "https://rag-credentials-api-304429350798.us-central1.run.app/rag/credentials/save",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        setMessage(
          `RAG Credentials saved successfully: ${response.data.message}`
        );
      } else {
        setMessage(
          `Failed to save RAG Credentials: ${
            response.data.message || response.data.error || "Unknown error"
          }`
        );
      }
    } catch (err: any) {
      let errorMessage = `Error saving RAG Credentials: ${
        err.message || "Please check console for details."
      }`;
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.data && err.response.data.message) {
          errorMessage = `Failed to save RAG Credentials: ${err.response.data.message}`;
        } else if (err.response.data && err.response.data.error) {
          errorMessage = `Failed to save RAG Credentials: ${err.response.data.error}`;
        } else {
          errorMessage = `Failed to save RAG Credentials: ${
            err.response.status
          } - ${err.response.statusText || "Unknown error"}`;
        }
      }
      setMessage(errorMessage);
    } finally {
      setShowMessage(true);
    }
  };

  // Sticky tab controls with icons (remains at the top, always visible while scrolling)
  return (
    <div className="flex-grow w-full bg-white rounded-lg shadow-md overflow-y-auto max-h-[calc(100vh-200px)] relative">
      {/* Sticky Tabs Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="flex w-full gap-4 px-8 pt-6 pb-4 bg-gray-800">
          <Button
            onClick={() => setSelectedSection("analysis")}
            className={`flex-1 flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg transition
              ${
                selectedSection === "analysis"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-blue-300"
              }
            `}
            tabIndex={0}
          >
            <ClipboardList size={20} /> Use Case
          </Button>
          <Button
            onClick={() => setSelectedSection("database")}
            className={`flex-1 flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg transition
              ${
                selectedSection === "database"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-blue-300"
              }
            `}
            tabIndex={0}
          >
            <Database size={20} /> DataSource
          </Button>
          <Button
            onClick={() => setSelectedSection("llm")}
            className={`flex-1 flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg transition
              ${
                selectedSection === "llm"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-blue-300"
              }
            `}
            tabIndex={0}
          >
            <Settings size={20} /> LLM Config
          </Button>
          <Button
            onClick={() => setSelectedSection("rag")}
            className={`flex-1 flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg transition
              ${
                selectedSection === "rag"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-blue-300"
              }
            `}
            tabIndex={0}
          >
            <Share2 size={20} /> RAG Config
          </Button>
        </div>
      </div>

      {/* Section content, scrollable below sticky tabs */}
      <div className="p-8">
        {selectedSection === "database" && (
          <>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Connect with Database
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label
                  htmlFor="databaseType"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Database Type
                </label>
                {loading ? (
                  <p className="text-gray-500">Loading database types...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : (
                  <select
                    id="databaseType"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={dbConfig.databaseType}
                    onChange={(e) =>
                      setDbConfig((prev) => ({
                        ...prev,
                        databaseType: e.target.value,
                      }))
                    }
                  >
                    {databaseOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label
                  htmlFor="connectionName"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Connection Name
                </label>
                <input
                  type="text"
                  id="connectionName"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={dbConfig.connectionName}
                  onChange={(e) =>
                    setDbConfig((prev) => ({
                      ...prev,
                      connectionName: e.target.value,
                    }))
                  }
                  placeholder="e.g., MyDatabaseConnection"
                />
              </div>
              <div>
                <label
                  htmlFor="serverName"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Server Name
                </label>
                <input
                  type="text"
                  id="serverName"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={dbConfig.serverName}
                  onChange={(e) =>
                    setDbConfig((prev) => ({
                      ...prev,
                      serverName: e.target.value,
                    }))
                  }
                  placeholder="e.g., localhost or 192.168.1.1"
                />
              </div>
              <div>
                <label
                  htmlFor="databaseName"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Database Name
                </label>
                <input
                  type="text"
                  id="databaseName"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={dbConfig.databaseName}
                  onChange={(e) =>
                    setDbConfig((prev) => ({
                      ...prev,
                      databaseName: e.target.value,
                    }))
                  }
                  placeholder="e.g., my_database"
                />
              </div>
              <div>
                <label
                  htmlFor="portNumber"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Port Number
                </label>
                <input
                  type="text"
                  id="portNumber"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={dbConfig.portNumber}
                  onChange={(e) =>
                    setDbConfig((prev) => ({
                      ...prev,
                      portNumber: e.target.value,
                    }))
                  }
                  placeholder="e.g., 5432"
                />
              </div>
              <div>
                <label
                  htmlFor="userName"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  User name
                </label>
                <input
                  type="text"
                  id="userName"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={dbConfig.userName}
                  onChange={(e) =>
                    setDbConfig((prev) => ({
                      ...prev,
                      userName: e.target.value,
                    }))
                  }
                  placeholder="e.g., sql_user"
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="databasePassword"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Database Password
                </label>
                <input
                  type="password"
                  id="databasePassword"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={dbConfig.databasePassword}
                  onChange={(e) =>
                    setDbConfig((prev) => ({
                      ...prev,
                      databasePassword: e.target.value,
                    }))
                  }
                  placeholder="********"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <Button
                onClick={handleConnect}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg"
              >
                Connect
              </Button>
            </div>
          </>
        )}

        {selectedSection === "llm" && (
          <>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              LLM Configuration
            </h3>
            {llmLoading ? (
              <p className="text-gray-500">Loading LLM configurations...</p>
            ) : llmError ? (
              <p className="text-red-500">{llmError}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label
                    htmlFor="llmProvider"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Provider
                  </label>
                  <select
                    id="llmProvider"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={llmConfig.llmProvider}
                    onChange={(e) =>
                      setLlmConfig((prev) => ({
                        ...prev,
                        llmProvider: e.target.value,
                      }))
                    }
                  >
                    {availableLlmModels &&
                      Object.keys(availableLlmModels.available).map(
                        (option) => (
                          <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        )
                      )}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="llmModelName"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Model Name
                  </label>
                  <select
                    id="llmModelName"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={llmConfig.llmModelName}
                    onChange={(e) =>
                      setLlmConfig((prev) => ({
                        ...prev,
                        llmModelName: e.target.value,
                      }))
                    }
                  >
                    {llmModelNameOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="prompt"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Prompt
                  </label>
                  <input
                    type="text"
                    id="prompt"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={llmConfig.prompt}
                    onChange={(e) =>
                      setLlmConfig((prev) => ({
                        ...prev,
                        prompt: e.target.value,
                      }))
                    }
                    placeholder="e.g., what is compliance"
                  />
                </div>
                <div>
                  <label
                    htmlFor="maxTokens"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    id="maxTokens"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={llmConfig.maxTokens}
                    onChange={(e) =>
                      setLlmConfig((prev) => ({
                        ...prev,
                        maxTokens: e.target.value,
                      }))
                    }
                    placeholder="e.g., 1000"
                  />
                </div>
                <div>
                  <label
                    htmlFor="temperature"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Temperature
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    id="temperature"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={llmConfig.temperature}
                    onChange={(e) =>
                      setLlmConfig((prev) => ({
                        ...prev,
                        temperature: e.target.value,
                      }))
                    }
                    placeholder="e.g., 0.2"
                  />
                </div>
              </div>
            )}
            <div className="flex justify-start gap-4 mt-4">
              <Button
                // Add actual enable LLM handler here
                onClick={() =>
                  setMessage("Enable LLM clicked (handler not implemented)")
                }
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg"
              >
                Enable LLM
              </Button>
            </div>
          </>
        )}

        {selectedSection === "rag" && (
          <>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              RAG Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label
                  htmlFor="generationLlmProvider"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Generation LLM Provider
                </label>
                {llmLoading ? (
                  <p className="text-gray-500">Loading providers...</p>
                ) : llmError ? (
                  <p className="text-red-500">{llmError}</p>
                ) : (
                  <select
                    id="generationLlmProvider"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={ragConfig.generationLlmProvider}
                    onChange={(e) =>
                      setRagConfig((prev) => ({
                        ...prev,
                        generationLlmProvider: e.target.value,
                      }))
                    }
                  >
                    {availableLlmModels &&
                      Object.keys(availableLlmModels.available).map(
                        (option) => (
                          <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        )
                      )}
                  </select>
                )}
              </div>
              <div>
                <label
                  htmlFor="generationModel"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Generation Model
                </label>
                {llmLoading ? (
                  <p className="text-gray-500">Loading models...</p>
                ) : llmError ? (
                  <p className="text-red-500">{llmError}</p>
                ) : (
                  <select
                    id="generationModel"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={ragConfig.generationModel}
                    onChange={(e) =>
                      setRagConfig((prev) => ({
                        ...prev,
                        generationModel: e.target.value,
                      }))
                    }
                  >
                    {generationModelOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label
                  htmlFor="generationApiKey"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Generation API Key
                </label>
                <input
                  type="password"
                  id="generationApiKey"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={ragConfig.generationApiKey}
                  onChange={(e) =>
                    setRagConfig((prev) => ({
                      ...prev,
                      generationApiKey: e.target.value,
                    }))
                  }
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label
                  htmlFor="embeddingProvider"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Embedding Provider
                </label>
                <select
                  id="embeddingProvider"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={ragConfig.embeddingProvider}
                  onChange={(e) =>
                    setRagConfig((prev) => ({
                      ...prev,
                      embeddingProvider: e.target.value,
                    }))
                  }
                >
                  {embeddingProviderOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="embeddingModel"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Embedding Model
                </label>
                <input
                  type="text"
                  id="embeddingModel"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={ragConfig.embeddingModel}
                  onChange={(e) =>
                    setRagConfig((prev) => ({
                      ...prev,
                      embeddingModel: e.target.value,
                    }))
                  }
                  placeholder="e.g., BAAI/bge-large-en-v1.5"
                />
              </div>
              <div>
                <label
                  htmlFor="embeddingApiKey"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Embedding API Key
                </label>
                <input
                  type="password"
                  id="embeddingApiKey"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={ragConfig.embeddingApiKey}
                  onChange={(e) =>
                    setRagConfig((prev) => ({
                      ...prev,
                      embeddingApiKey: e.target.value,
                    }))
                  }
                  placeholder="API Key (if needed)"
                />
              </div>
            </div>
            <h4 className="text-xl font-semibold text-gray-800 mb-6">
              Azure Blob Storage
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div>
                <label
                  htmlFor="storageAccount"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Storage Account
                </label>
                <input
                  type="text"
                  id="storageAccount"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={ragConfig.storageAccount}
                  onChange={(e) =>
                    setRagConfig((prev) => ({
                      ...prev,
                      storageAccount: e.target.value,
                    }))
                  }
                  placeholder="e.g., mystorageaccount"
                />
              </div>
              <div>
                <label
                  htmlFor="containerName"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Container Name
                </label>
                <input
                  type="text"
                  id="containerName"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={ragConfig.containerName}
                  onChange={(e) =>
                    setRagConfig((prev) => ({
                      ...prev,
                      containerName: e.target.value,
                    }))
                  }
                  placeholder="e.g., compliance-docs"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <label
                  htmlFor="connectionString"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Connection String
                </label>
                <textarea
                  id="connectionString"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y"
                  rows={3}
                  value={ragConfig.connectionString}
                  onChange={(e) =>
                    setRagConfig((prev) => ({
                      ...prev,
                      connectionString: e.target.value,
                    }))
                  }
                  placeholder="DefaultEndpointsProtocol=https;AccountName=..."
                ></textarea>
              </div>
            </div>
            <h4 className="text-xl font-semibold text-gray-800 mb-6">
              Vector Database Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label
                  htmlFor="vectorDBType"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Vector DB Type
                </label>
                <select
                  id="vectorDBType"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={ragConfig.vectorDBType}
                  onChange={(e) =>
                    setRagConfig((prev) => ({
                      ...prev,
                      vectorDBType: e.target.value,
                    }))
                  }
                >
                  {vectorDBTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="vectorDBConnectionStringEndpoint"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Connection String/Endpoint
                </label>
                <input
                  type="text"
                  id="vectorDBConnectionStringEndpoint"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={ragConfig.vectorDBConnectionStringEndpoint}
                  onChange={(e) =>
                    setRagConfig((prev) => ({
                      ...prev,
                      vectorDBConnectionStringEndpoint: e.target.value,
                    }))
                  }
                  placeholder="https://your-cosmos.documents.azure.com:443/"
                />
              </div>
              <div>
                <label
                  htmlFor="vectorDBAPIKey"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  API Key
                </label>
                <input
                  type="password"
                  id="vectorDBAPIKey"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={ragConfig.vectorDBAPIKey}
                  onChange={(e) =>
                    setRagConfig((prev) => ({
                      ...prev,
                      vectorDBAPIKey: e.target.value,
                    }))
                  }
                  placeholder="Primary key"
                />
              </div>
            </div>
            <h4 className="text-xl font-semibold text-gray-800 mb-6">
              Azure Cosmos DB Specific
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label
                  htmlFor="cosmosDBDatabaseName"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Database Name
                </label>
                <input
                  type="text"
                  id="cosmosDBDatabaseName"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={ragConfig.cosmosDBDatabaseName}
                  onChange={(e) =>
                    setRagConfig((prev) => ({
                      ...prev,
                      cosmosDBDatabaseName: e.target.value,
                    }))
                  }
                  placeholder="ComplianceVectorDB"
                />
              </div>
              <div>
                <label
                  htmlFor="cosmosDBContainerName"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Container Name
                </label>
                <input
                  type="text"
                  id="cosmosDBContainerName"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={ragConfig.cosmosDBContainerName}
                  onChange={(e) =>
                    setRagConfig((prev) => ({
                      ...prev,
                      cosmosDBContainerName: e.target.value,
                    }))
                  }
                  placeholder="compliance_vectors"
                />
              </div>
            </div>

            <div className="flex justify-start gap-4 mt-4">
              <Button
                onClick={handleSaveRagCredentials}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg"
              >
                Save RAG Credentials
              </Button>
            </div>
          </>
        )}

        {selectedSection === "analysis" && (
          <>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Analysis Modes
            </h3>
            <div className="mb-4">
              <label
                htmlFor="useCase"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Select Use Case
              </label>
              {useCaseLoading ? (
                <p className="text-gray-500">Loading analysis modes...</p>
              ) : useCaseError ? (
                <p className="text-red-500">{useCaseError}</p>
              ) : (
                <select
                  id="useCase"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={analysisConfig.selectedUseCase}
                  onChange={(e) =>
                    setAnalysisConfig((prev) => ({
                      ...prev,
                      selectedUseCase: e.target.value,
                    }))
                  }
                >
                  {useCases.map((useCase) => (
                    <option key={useCase.value} value={useCase.value}>
                      {useCase.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {checksLoading ? (
              <p className="text-gray-500">Loading checks...</p>
            ) : checksError ? (
              <p className="text-red-500">{checksError}</p>
            ) : (
              <>
                {dormantChecks.length > 0 && (
                  <div className="mt-6 p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Dormant Checks
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {dormantChecks.map((check) => (
                        <div key={check.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={check.id}
                            checked={analysisConfig.selectedDormantChecks.includes(
                              check.id
                            )}
                            onChange={(e) =>
                              handleCheckboxChange(
                                check.id,
                                e.target.checked,
                                "dormant"
                              )
                            }
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={check.id}
                            className="ml-2 text-gray-700 text-sm"
                          >
                            {check.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {complianceChecks.length > 0 && (
                  <div className="mt-6 p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Compliance Checks
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {complianceChecks.map((check) => (
                        <div key={check.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={check.id}
                            checked={analysisConfig.selectedComplianceChecks.includes(
                              check.id
                            )}
                            onChange={(e) =>
                              handleCheckboxChange(
                                check.id,
                                e.target.checked,
                                "compliance"
                              )
                            }
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={check.id}
                            className="ml-2 text-gray-700 text-sm"
                          >
                            {check.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-start mt-4">
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
              >
                Save
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
