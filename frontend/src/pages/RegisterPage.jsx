/**
 * RegisterPage
 * New account form with username, email, and password.
 * Includes basic client-side validation before hitting the API.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input  from "../components/ui/Input";
import Button from "../components/ui/Button";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    username: "", email: "", password: "", confirm: "",
  });
  const [errors,  setErrors]  = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading]  = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
    setApiError("");
  };

  const validate = () => {
    const errs = {};
    if (form.username.trim().length < 3)
      errs.username = "Username must be at least 3 characters";
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      errs.email = "Please enter a valid email";
    if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    if (form.password !== form.confirm)
      errs.confirm = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiError("");
    try {
      await register(form.username.trim(), form.email.trim(), form.password);
      navigate("/");
    } catch (err) {
      setApiError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4
      bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-100/60
      dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900">

      <div className="w-full max-w-sm animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14
            bg-brand-500 rounded-2xl shadow-lg mb-4 text-2xl">
            💬
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Free forever. No credit card needed.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl
          border border-slate-100 dark:border-slate-700 p-8">

          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm
              bg-red-50 dark:bg-red-500/10
              text-red-600 dark:text-red-400
              border border-red-100 dark:border-red-500/20">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="e.g. alice123"
              autoComplete="username"
              error={errors.username}
              required
            />
            <Input
              label="Email address"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              error={errors.password}
              required
            />
            <Input
              label="Confirm password"
              type="password"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Repeat your password"
              autoComplete="new-password"
              error={errors.confirm}
              required
            />
            <Button type="submit" loading={loading} className="w-full mt-1">
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-500 hover:text-brand-600 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
