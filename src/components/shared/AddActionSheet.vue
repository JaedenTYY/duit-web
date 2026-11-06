<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/shared/AppIcon.vue'
import { useDialogFocusManagement } from '@/composables/useDialogFocusManagement'

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'scan'): void
  (event: 'manual'): void
  (event: 'split'): void
}>()

const dialogRef = ref<HTMLElement | null>(null)
useDialogFocusManagement(dialogRef, { onEscape: () => emit('close') })
</script>

<template>
  <Teleport to="body">
    <div class="add-sheet-layer">
      <button
        type="button"
        class="add-sheet-scrim"
        aria-label="Close Add menu"
        @click="emit('close')"
      />
      <section
        ref="dialogRef"
        class="add-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-sheet-title"
        tabindex="-1"
      >
        <div class="add-sheet-handle" />
        <div class="add-sheet-heading">
          <h2 id="add-sheet-title">Add to Duit</h2>
          <button
            type="button"
            class="add-sheet-close"
            aria-label="Close Add menu"
            @click="emit('close')"
          >
            ×
          </button>
        </div>
        <button type="button" class="add-sheet-option" @click="emit('scan')">
          <span class="add-sheet-icon"><AppIcon name="camera" /></span>
          <span><strong>Scan a receipt</strong><small>Review the details before saving</small></span>
        </button>
        <button type="button" class="add-sheet-option" @click="emit('manual')">
          <span class="add-sheet-icon"><AppIcon name="plus" /></span>
          <span><strong>Add manually</strong><small>Amount, merchant, category</small></span>
        </button>
        <button type="button" class="add-sheet-option" @click="emit('split')">
          <span class="add-sheet-icon"><AppIcon name="users" /></span>
          <span><strong>Split a bill</strong><small>Friends choose their items</small></span>
        </button>
      </section>
    </div>
  </Teleport>
</template>
