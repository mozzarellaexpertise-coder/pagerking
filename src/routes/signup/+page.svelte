<script lang="ts">
  import { enhance } from '$app/forms';
  let message = '';

  const handle = enhance(async ({ result }) => {
    if (result?.type === 'success') {
      message = 'Signup successful! Please check your email for confirmation.';
      window.location.href = '/login';
    } else {
      message = result?.data?.error || 'Signup failed';
    }
  });
</script>

<form use:handle method="POST">
  <input type="email" name="email" placeholder="Email" required />
  <input type="password" name="password" placeholder="Password" required />
  <button type="submit">Signup</button>
</form>

<p>{message}</p>
