import { useState, useEffect, useCallback } from 'react';
import { AppConfig, DEFAULT_CONFIG } from '../types';
import { getConfig, saveConfig as saveConfigToDB } from '../db';

interface UseConfigReturn {
    config: AppConfig;
    isLoaded: boolean;
    saveConfig: (config: AppConfig) => Promise<void>;
}

export const useConfig = (): UseConfigReturn => {
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        getConfig()
            .then((loaded) => {
                setConfig(loaded);
                setIsLoaded(true);
            })
            .catch((err) => {
                console.error('Failed to load config', err);
                setIsLoaded(true);
            });
    }, []);

    const saveConfig = useCallback(async (newConfig: AppConfig) => {
        await saveConfigToDB(newConfig);
        setConfig(newConfig);
    }, []);

    return { config, isLoaded, saveConfig };
};
