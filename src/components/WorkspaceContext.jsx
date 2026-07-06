import { createContext, useContext, useState } from 'react';
import axios from 'axios';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const [cache, setCache] = useState({
    dashboard: null,
    projects: null,
    team: null,
    activities: null,
    notifications: null,
    calendar: null,
    projectDetails: {} // projectId -> { project, members, activities }
  });

  const updateCache = (key, data, subKey = null) => {
    setCache(prev => {
      const existing = subKey ? prev[key]?.[subKey] : prev[key];
      // Fast deep equality check for API JSON responses
      if (JSON.stringify(existing) === JSON.stringify(data)) {
        return prev;
      }
      
      if (subKey) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [subKey]: data
          }
        };
      }
      return {
        ...prev,
        [key]: data
      };
    });
  };

  const getCachedOrFetch = async (key, url, forceRefetch = false, subKey = null) => {
    const cacheRef = subKey ? cache[key]?.[subKey] : cache[key];
    if (cacheRef && !forceRefetch) {
      axios.get(url).then(res => {
        const data = res.data?.data;
        if (data) {
          updateCache(key, data?.projects ? data.projects : data, subKey);
        }
      }).catch(err => console.error(`Background fetch failed for ${key}/${subKey || ''}:`, err));
      
      return cacheRef;
    }

    const res = await axios.get(url);
    const data = res.data?.data;
    const resolvedData = data?.projects ? data.projects : data;
    updateCache(key, resolvedData, subKey);
    return resolvedData;
  };

  const clearCache = () => {
    setCache({
      dashboard: null,
      projects: null,
      team: null,
      activities: null,
      notifications: null,
      calendar: null,
      projectDetails: {}
    });
  };

  return (
    <WorkspaceContext.Provider value={{ cache, updateCache, getCachedOrFetch, clearCache }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
