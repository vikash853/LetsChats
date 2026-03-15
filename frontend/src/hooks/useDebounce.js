/**
 * useDebounce
 * Delays updating a value until the user stops typing.
 * Used in the search bar — prevents firing an API call on every keystroke.
 *
 * Example: typing "alice" fires only ONE request (after 400ms of silence)
 * instead of 5 requests for a, al, ali, alic, alice.
 */
import { useState, useEffect } from "react";

export const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // Cancel if value changes before delay
  }, [value, delay]);

  return debounced;
};
