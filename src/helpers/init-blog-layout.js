export default function initBlogLayout() {
  const button = document.querySelector('.blog-index__layout-toggle');
  if (!button) return;

  const isCollapsed = localStorage.getItem('blog-layout-collapsed') === 'true';
  if (isCollapsed) {
    toggleLayout(button, true);
  }

  setupLayoutToggle(button);
}

function toggleLayout(button, isCollapsed) {
  const allPosts = document.querySelectorAll('.blog-post-card');
  allPosts.forEach(post => {
    post.classList.toggle('blog-post-card--collapsed', isCollapsed);
  });

  const expandedIcon = button.querySelector('.layout-expanded-icon');
  const collapsedIcon = button.querySelector('.layout-collapsed-icon');

  collapsedIcon.classList.toggle('layout-toggle__icon--hidden', isCollapsed);
  expandedIcon.classList.toggle('layout-toggle__icon--hidden', !isCollapsed);
}

function setupLayoutToggle(button) {
  button.addEventListener('click', () => {
    const handleToggle = () => {
      const isCollapsed = localStorage.getItem('blog-layout-collapsed') === 'true';
      const newState = !isCollapsed;

      toggleLayout(button, newState);
      localStorage.setItem('blog-layout-collapsed', newState);
    };

    if (document.startViewTransition) {
      document.startViewTransition(() => handleToggle());
    } else {
      handleToggle();
    }
  });
}
