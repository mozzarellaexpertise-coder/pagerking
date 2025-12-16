<script lang="ts">
  import { enhance } from '$app/forms';

  let message = '';

  const handle = enhance(async ({ result }) => {
    if (result?.type === 'success') {
      message = 'Login successful!';
      // redirect to admin panel
      window.location.href = '/admin';
    } else {
      message = result?.data?.error || 'Login failed';
    }
  });
</script>

<form use:handle method="POST">
  <input type="email" name="email" placeholder="Email" required />
  <input type="password" name="password" placeholder="Password" required />
  <button type="submit">Login</button>
</form>

<p>{message}</p>
