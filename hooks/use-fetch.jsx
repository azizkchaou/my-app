import { set } from "date-fns";
import React from "react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
const useFetch = (cb) => {
    const [data, setData] = useState(undefined);
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);

    const fn = async (...args) => {
        setLoading(true);
        setError(null);
        try {
            const result = await cb(...args);
            setData(result);
            setError(null);
        }
        catch (err) {
            setError(err);
            toast.error(err.message)
        }
        finally {
            setLoading(false);
        }
    }
    return {data , loading , error , fn , setData};

};
export default useFetch;