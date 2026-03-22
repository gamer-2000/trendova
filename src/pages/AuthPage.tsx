const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const { error } = isLogin
    ? await signIn(email, password)
    : await signUp(email, password); // just sign up normally

  setLoading(false);

  if (error) {
    toast.error(error.message);
  } else {
    toast.success(isLogin ? 'Signed in successfully!' : 'Account created successfully!');
  }
};
